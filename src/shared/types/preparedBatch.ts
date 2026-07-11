import type { Timestamp } from 'firebase/firestore';

import type { PreparedBatch } from '../../domain/batches/types';

/**
 * Firestore-facing `preparedBatches/{batchId}` document shape: the pure
 * domain `PreparedBatch<TTimestamp>` generic bound to the concrete Firebase
 * `Timestamp` type. This is the only place the domain shape and Firebase are
 * wired together; `src/domain/**` itself stays framework-free.
 */
export type PreparedBatchDoc = PreparedBatch<Timestamp>;

/** A `PreparedBatchDoc` paired with its Firestore document id. */
export type PreparedBatchWithId = PreparedBatchDoc & { id: string };
