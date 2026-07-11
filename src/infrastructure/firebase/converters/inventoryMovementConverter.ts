import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

import type { InventoryMovementDoc } from '../../../shared/types/inventoryMovement';

/** Typed read/write mapping for `inventoryMovements/{movementId}` documents. */
export const inventoryMovementConverter: FirestoreDataConverter<InventoryMovementDoc> = {
  toFirestore(movement: InventoryMovementDoc) {
    return movement;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): InventoryMovementDoc {
    const data = snapshot.data(options);

    return {
      ingredientId: data.ingredientId as string,
      ingredientName: data.ingredientName as string,
      type: data.type as InventoryMovementDoc['type'],
      deltaQuantity: (data.deltaQuantity ?? null) as number | null,
      presenceBefore: (data.presenceBefore ?? null) as boolean | null,
      presenceAfter: (data.presenceAfter ?? null) as boolean | null,
      balanceAfter: (data.balanceAfter ?? null) as number | null,
      cookingRequestId: (data.cookingRequestId ?? null) as string | null,
      preparedBatchId: (data.preparedBatchId ?? null) as string | null,
      note: (data.note ?? null) as string | null,
      createdAt: data.createdAt as Timestamp,
      createdBy: data.createdBy as string,
    };
  },
};
