import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

import type { OrderAllocation } from '../../../domain/orders/types';
import type { OrderDoc } from '../../../shared/types/order';

/** Typed read/write mapping for `orders/{orderId}` documents. */
export const orderConverter: FirestoreDataConverter<OrderDoc> = {
  toFirestore(order: OrderDoc) {
    return order;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): OrderDoc {
    const data = snapshot.data(options);

    return {
      userId: data.userId as string,
      userDisplayName: data.userDisplayName as string,
      dishId: data.dishId as string,
      dishName: data.dishName as string,
      kind: data.kind as OrderDoc['kind'],
      status: data.status as OrderDoc['status'],
      quantity: data.quantity as number,
      mealType: data.mealType as OrderDoc['mealType'],
      scheduledFor: data.scheduledFor as Timestamp,
      allocations: (data.allocations ?? []) as OrderAllocation[],
      rejectionReason: (data.rejectionReason ?? null) as string | null,
      preparedBatchId: (data.preparedBatchId ?? null) as string | null,
      preparedBatchNumber: (data.preparedBatchNumber ?? null) as number | null,
      createdAt: data.createdAt as Timestamp,
      createdBy: data.createdBy as string,
      updatedAt: data.updatedAt as Timestamp,
      updatedBy: data.updatedBy as string,
    };
  },
};
