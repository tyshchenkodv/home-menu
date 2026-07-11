import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import { validateDish } from '../../../domain/dishes/validateDish';
import type { MealType, RecipeItem } from '../../../domain/dishes/types';
import type { DishDoc, DishWithId } from '../../../shared/types/dish';
import { dishConverter } from '../converters/dishConverter';
import { getFirebaseApp } from '../firebaseApp';

const COLLECTION = 'dishes';

const getDishesCollection = () => collection(getFirestore(getFirebaseApp()), COLLECTION);

/** Fields an administrator supplies when creating a dish. */
export interface CreateDishInput {
  name: string;
  description: string;
  mealTypes: MealType[];
  recipeItems: RecipeItem[];
}

/** Fields an administrator may edit on an existing dish. */
export type UpdateDishInput = CreateDishInput;

function toDomainDraft(input: CreateDishInput): Parameters<typeof validateDish>[0] {
  const placeholder = Timestamp.now();

  return {
    name: input.name,
    description: input.description,
    mealTypes: input.mealTypes,
    recipeItems: input.recipeItems,
    archivedAt: null,
    createdAt: placeholder,
    createdBy: 'placeholder',
    updatedAt: placeholder,
    updatedBy: 'placeholder',
  };
}

/**
 * Creates a new dish document. Re-runs domain validation on the proposed
 * shape before writing, so infrastructure never persists a document that
 * violates the SPEC invariants even if the caller's UI validation is
 * bypassed. A dish may be created with an empty recipe (see
 * `validateDish`) — it simply derives "not configured".
 */
export const createDish = async (input: CreateDishInput, uid: string): Promise<string> => {
  validateDish(toDomainDraft(input));

  const now = Timestamp.now();
  const docRef = await addDoc(getDishesCollection(), {
    name: input.name,
    description: input.description,
    mealTypes: input.mealTypes,
    recipeItems: input.recipeItems,
    archivedAt: null,
    createdAt: now,
    createdBy: uid,
    updatedAt: now,
    updatedBy: uid,
  } satisfies DishDoc);

  return docRef.id;
};

/**
 * Updates the editable fields of an existing dish (name, description, meal
 * types, and the full recipe), refreshing `updatedAt`/`updatedBy`.
 */
export const updateDish = async (dishId: string, input: UpdateDishInput, uid: string): Promise<void> => {
  validateDish(toDomainDraft(input));

  const dishDocRef = doc(getDishesCollection(), dishId);

  await updateDoc(dishDocRef, {
    name: input.name,
    description: input.description,
    mealTypes: input.mealTypes,
    recipeItems: input.recipeItems,
    updatedAt: Timestamp.now(),
    updatedBy: uid,
  });
};

/**
 * Soft-deletes a dish by setting `archivedAt`. The dish leaves the menu but
 * its order and batch history is preserved; it can be restored later.
 */
export const archiveDish = async (dishId: string, uid: string): Promise<void> => {
  const dishDocRef = doc(getDishesCollection(), dishId);
  const now = Timestamp.now();

  await updateDoc(dishDocRef, {
    archivedAt: now,
    updatedAt: now,
    updatedBy: uid,
  });
};

/** Restores a previously archived dish by clearing `archivedAt`. */
export const restoreDish = async (dishId: string, uid: string): Promise<void> => {
  const dishDocRef = doc(getDishesCollection(), dishId);

  await updateDoc(dishDocRef, {
    archivedAt: null,
    updatedAt: Timestamp.now(),
    updatedBy: uid,
  });
};

const mapSnapshot = (snapshot: QuerySnapshot<DishDoc>): DishWithId[] =>
  snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));

/** Subscribes to active (`archivedAt == null`) dishes ordered by name. */
export const subscribeActiveDishes = (
  onNext: (dishes: DishWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const activeQuery = query(
    getDishesCollection().withConverter(dishConverter),
    where('archivedAt', '==', null),
    orderBy('name'),
  );

  return onSnapshot(
    activeQuery,
    snapshot => {
      onNext(mapSnapshot(snapshot));
    },
    onError,
  );
};

/**
 * Subscribes to archived (`archivedAt != null`) dishes. Firestore requires
 * the first `orderBy` to match a field used in an inequality filter, so this
 * orders by `archivedAt` first and `name` second, matching the
 * `dishes: archivedAt ASC, name ASC` composite index.
 */
export const subscribeArchivedDishes = (
  onNext: (dishes: DishWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const archivedQuery = query(
    getDishesCollection().withConverter(dishConverter),
    where('archivedAt', '!=', null),
    orderBy('archivedAt'),
    orderBy('name'),
  );

  return onSnapshot(
    archivedQuery,
    snapshot => {
      onNext(mapSnapshot(snapshot));
    },
    onError,
  );
};
