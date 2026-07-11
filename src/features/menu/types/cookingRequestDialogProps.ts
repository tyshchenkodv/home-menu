import type { CalendarDate, MealType } from '../../../domain/orders/types';

export interface CookingRequestDialogProps {
  open: boolean;
  dishName: string;
  /** Date the request targets, pre-selected on the Menu screen; shown read-only. */
  date: CalendarDate;
  /** Meal the request targets, pre-selected on the Menu screen; shown read-only. */
  mealType: MealType;
  onCancel: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}
