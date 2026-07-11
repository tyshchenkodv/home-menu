import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

import type { RecipeItem } from '../../../domain/dishes/types';
import type { DishDoc } from '../../../shared/types/dish';

/** Typed read/write mapping for `dishes/{dishId}` documents. */
export const dishConverter: FirestoreDataConverter<DishDoc> = {
  toFirestore(dish: DishDoc) {
    return dish;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): DishDoc {
    const data = snapshot.data(options);

    return {
      name: data.name as string,
      description: data.description as string,
      mealTypes: data.mealTypes as DishDoc['mealTypes'],
      recipeItems: (data.recipeItems ?? []) as RecipeItem[],
      archivedAt: (data.archivedAt ?? null) as DishDoc['archivedAt'],
      createdAt: data.createdAt as Timestamp,
      createdBy: data.createdBy as string,
      updatedAt: data.updatedAt as Timestamp,
      updatedBy: data.updatedBy as string,
    };
  },
};
