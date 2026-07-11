import type { MealType } from '../../../domain/orders/types';

export interface ReserveDialogProps {
  open: boolean;
  dishName: string;
  availableQuantity: number;
  /** Meal category the reservation is for, shown as a tag chip next to the dialog title. */
  mealType: MealType;
  /** Locale-formatted date label (same format as the `DateMealSelector` date chips), shown in the subtitle. */
  dateLabel: string;
  onCancel: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}
