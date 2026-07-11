import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

import type { PreparedBatchDoc } from '../../../shared/types/preparedBatch';

/** Typed read/write mapping for `preparedBatches/{batchId}` documents. */
export const preparedBatchConverter: FirestoreDataConverter<PreparedBatchDoc> = {
  toFirestore(batch: PreparedBatchDoc) {
    return batch;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): PreparedBatchDoc {
    const data = snapshot.data(options);

    return {
      dishId: data.dishId as string,
      dishName: data.dishName as string,
      batchNumber: (data.batchNumber ?? null) as number | null,
      producedQuantity: data.producedQuantity as number,
      availableQuantity: data.availableQuantity as number,
      reservedQuantity: data.reservedQuantity as number,
      consumedQuantity: data.consumedQuantity as number,
      discardedQuantity: data.discardedQuantity as number,
      preparedAt: data.preparedAt as Timestamp,
      expiresAt: (data.expiresAt ?? null) as PreparedBatchDoc['expiresAt'],
      status: data.status as PreparedBatchDoc['status'],
      sourceCookingRequestId: (data.sourceCookingRequestId ?? null) as string | null,
      createdAt: data.createdAt as Timestamp,
      createdBy: data.createdBy as string,
      updatedAt: data.updatedAt as Timestamp,
      updatedBy: data.updatedBy as string,
    };
  },
};
