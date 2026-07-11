import type { OrderStatus } from '../../../domain/orders/types';
import type { OrderWithId } from '../../../shared/types/order';

export type HistoryStatusFilter = Extract<OrderStatus, 'reserved' | 'consumed' | 'rejected' | 'cancelled'> | 'all';

export interface HistoryListProps {
  orders: OrderWithId[];
  filter: HistoryStatusFilter;
  onFilterChange: (filter: HistoryStatusFilter) => void;
  /**
   * Admin actions for a `reserved` order that still needs action (T5.8):
   * per `docs/design/screens/admin-orders.md`'s resolved decision, `reserved`
   * orders live in this History tab (not a 5th Kanban column), so this is
   * where "Mark consumed"/"Cancel" render. Omitted for a read-only view.
   */
  onConsume?: (order: OrderWithId) => void;
  onCancel?: (order: OrderWithId) => void;
}
