import type { OrderStatus } from '../../../domain/orders/types';
import type { OrderWithId } from '../../../shared/types/order';

export type HistoryStatusFilter = Extract<OrderStatus, 'reserved' | 'consumed' | 'rejected' | 'cancelled'> | 'all';

export interface HistoryListProps {
  orders: OrderWithId[];
  filter: HistoryStatusFilter;
  onFilterChange: (filter: HistoryStatusFilter) => void;
}
