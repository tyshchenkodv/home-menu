import type { DomainTimestamp } from '../../../domain/orders/types';
import type { OrderWithId } from '../../../shared/types/order';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';

export interface OrderCardProps {
  order: OrderWithId;
  now: DomainTimestamp;
  /** The batches allocated to this order (empty for a `cook` order or once fully consumed/cancelled). */
  allocatedBatches: PreparedBatchWithId[];
  onCancel: (order: OrderWithId) => void;
}
