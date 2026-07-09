import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

import type { IngredientDoc } from '../../../shared/types/ingredient';

/** Typed read/write mapping for `ingredients/{ingredientId}` documents. */
export const ingredientConverter: FirestoreDataConverter<IngredientDoc> = {
  toFirestore(ingredient: IngredientDoc) {
    return ingredient;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): IngredientDoc {
    const data = snapshot.data(options);

    return {
      name: data.name as string,
      trackingMode: data.trackingMode as IngredientDoc['trackingMode'],
      baseUnit: data.baseUnit as IngredientDoc['baseUnit'],
      quantity: (data.quantity ?? null) as number | null,
      isPresent: (data.isPresent ?? null) as boolean | null,
      lowStockThreshold: (data.lowStockThreshold ?? null) as number | null,
      archivedAt: (data.archivedAt ?? null) as IngredientDoc['archivedAt'],
      createdAt: data.createdAt as Timestamp,
      createdBy: data.createdBy as string,
      updatedAt: data.updatedAt as Timestamp,
      updatedBy: data.updatedBy as string,
    };
  },
};
