import type { OrderWithId } from '../../../shared/types/order';

export interface AdminOrderCardProps {
  order: OrderWithId;
  /** Only present for the 4 active Kanban statuses; `undefined` renders a read-only History row. */
  onApprove?: (order: OrderWithId) => void;
  onReject?: (order: OrderWithId) => void;
  onStartCooking?: (order: OrderWithId) => void;
  onMarkPrepared?: (order: OrderWithId) => void;
  onCorrect?: (order: OrderWithId) => void;
  /** Only present where a `reserved` order needs admin action (the History tab row). */
  onConsume?: (order: OrderWithId) => void;
  onCancel?: (order: OrderWithId) => void;
}
