import type { OrderStatus } from '../../../domain/orders/types';
import type { OrderWithId } from '../../../shared/types/order';

export interface KanbanColumnProps {
  status: Extract<OrderStatus, 'pending' | 'approved' | 'cooking' | 'prepared'>;
  orders: OrderWithId[];
  /** When true (mobile), the section header toggles its cards open/closed. */
  collapsible: boolean;
  onApprove: (order: OrderWithId) => void;
  onReject: (order: OrderWithId) => void;
  onStartCooking: (order: OrderWithId) => void;
  onMarkPrepared: (order: OrderWithId) => void;
  onCorrect: (order: OrderWithId) => void;
}
