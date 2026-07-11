import type { OrderWithId } from '../../../shared/types/order';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';

export interface UseMyOrdersResult {
  status: 'loading' | 'ready' | 'error';
  orders: OrderWithId[];
  /** Batches referenced by the user's `reserved` allocations, keyed by batch id — used to surface the batch-expired/discarded warning (SPEC rule 5). */
  batchesById: Map<string, PreparedBatchWithId>;
  error: Error | null;
}
