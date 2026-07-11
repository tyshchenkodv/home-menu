import type { OrderWithId } from '../../../shared/types/order';

export interface KanbanBoardProps {
  orders: OrderWithId[];
  onApprove: (order: OrderWithId) => void;
  onReject: (order: OrderWithId) => void;
  onStartCooking: (order: OrderWithId) => void;
  onMarkPrepared: (order: OrderWithId) => void;
  onCorrect: (order: OrderWithId) => void;
}
