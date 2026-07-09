import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import { InventoryDomainError } from '../../../domain/inventory/errors';
import type { BaseUnit, TrackingMode } from '../../../domain/inventory/types';
import { validateIngredient } from '../../../domain/inventory/validateIngredient';
import type { IngredientDoc, IngredientWithId } from '../../../shared/types/ingredient';
import { ingredientConverter } from '../converters/ingredientConverter';
import { getFirebaseApp } from '../firebaseApp';

const COLLECTION = 'ingredients';

const getIngredientsCollection = () => collection(getFirestore(getFirebaseApp()), COLLECTION);

/** Fields an administrator supplies when creating an ingredient. */
export interface CreateIngredientInput {
  name: string;
  trackingMode: TrackingMode;
  baseUnit: BaseUnit;
  quantity: number | null;
  isPresent: boolean | null;
  lowStockThreshold: number | null;
}

/** Fields an administrator may edit on an existing ingredient. */
export interface UpdateIngredientInput {
  name: string;
  lowStockThreshold: number | null;
}

function toDomainDraft(
  input:
    | CreateIngredientInput
    | (UpdateIngredientInput & Pick<IngredientDoc, 'trackingMode' | 'baseUnit' | 'quantity' | 'isPresent'>),
): Parameters<typeof validateIngredient>[0] {
  const placeholder = Timestamp.now();

  return {
    name: input.name,
    trackingMode: input.trackingMode,
    baseUnit: input.baseUnit,
    quantity: input.quantity,
    isPresent: input.isPresent,
    lowStockThreshold: input.lowStockThreshold,
    archivedAt: null,
    createdAt: placeholder,
    createdBy: 'placeholder',
    updatedAt: placeholder,
    updatedBy: 'placeholder',
  };
}

/**
 * Creates a new ingredient document. Re-runs domain validation on the
 * proposed shape before writing, so infrastructure never persists a document
 * that violates the SPEC invariants even if the caller's UI validation is
 * bypassed.
 */
export const createIngredient = async (input: CreateIngredientInput, uid: string): Promise<string> => {
  validateIngredient(toDomainDraft(input));

  const now = Timestamp.now();
  const docRef = await addDoc(getIngredientsCollection(), {
    name: input.name,
    trackingMode: input.trackingMode,
    baseUnit: input.baseUnit,
    quantity: input.quantity,
    isPresent: input.isPresent,
    lowStockThreshold: input.lowStockThreshold,
    archivedAt: null,
    createdAt: now,
    createdBy: uid,
    updatedAt: now,
    updatedBy: uid,
  } satisfies IngredientDoc);

  return docRef.id;
};

/**
 * Updates the editable `name`/`lowStockThreshold` fields of an existing
 * ingredient. Reads the current document to re-validate the full merged
 * shape before writing, refreshing `updatedAt`/`updatedBy`.
 */
export const updateIngredient = async (
  ingredientId: string,
  input: UpdateIngredientInput,
  uid: string,
): Promise<void> => {
  const ingredientDocRef = doc(getIngredientsCollection(), ingredientId).withConverter(ingredientConverter);
  const snapshot = await getDoc(ingredientDocRef);

  if (!snapshot.exists()) {
    throw new InventoryDomainError('INVALID_NAME', `Ingredient ${ingredientId} does not exist`);
  }

  const current = snapshot.data();

  validateIngredient(
    toDomainDraft({
      name: input.name,
      lowStockThreshold: input.lowStockThreshold,
      trackingMode: current.trackingMode,
      baseUnit: current.baseUnit,
      quantity: current.quantity,
      isPresent: current.isPresent,
    }),
  );

  await updateDoc(ingredientDocRef, {
    name: input.name,
    lowStockThreshold: input.lowStockThreshold,
    updatedAt: Timestamp.now(),
    updatedBy: uid,
  });
};

/**
 * Soft-deletes an ingredient by setting `archivedAt`. Does not create an
 * inventory movement; the current stock/presence state is preserved.
 */
export const archiveIngredient = async (ingredientId: string, uid: string): Promise<void> => {
  const ingredientDocRef = doc(getIngredientsCollection(), ingredientId);
  const now = Timestamp.now();

  await updateDoc(ingredientDocRef, {
    archivedAt: now,
    updatedAt: now,
    updatedBy: uid,
  });
};

/**
 * Restores a previously archived ingredient by clearing `archivedAt`. Does
 * not create an inventory movement; stock/presence state is unchanged.
 */
export const restoreIngredient = async (ingredientId: string, uid: string): Promise<void> => {
  const ingredientDocRef = doc(getIngredientsCollection(), ingredientId);

  await updateDoc(ingredientDocRef, {
    archivedAt: null,
    updatedAt: Timestamp.now(),
    updatedBy: uid,
  });
};

const mapSnapshot = (snapshot: QuerySnapshot<IngredientDoc>): IngredientWithId[] =>
  snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));

/** Subscribes to active (`archivedAt == null`) ingredients ordered by name. */
export const subscribeActiveIngredients = (
  onNext: (ingredients: IngredientWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const activeQuery = query(
    getIngredientsCollection().withConverter(ingredientConverter),
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
 * Subscribes to archived (`archivedAt != null`) ingredients. Firestore
 * requires the first `orderBy` to match a field used in an inequality
 * filter, so this orders by `archivedAt` first and `name` second; the
 * archived tab is expected to be smaller and less frequently browsed than
 * the active list, so a secondary in-memory sort is not needed here.
 */
export const subscribeArchivedIngredients = (
  onNext: (ingredients: IngredientWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const archivedQuery = query(
    getIngredientsCollection().withConverter(ingredientConverter),
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
