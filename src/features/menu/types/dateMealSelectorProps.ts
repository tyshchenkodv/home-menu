import type { MealType } from '../../../domain/orders/types';
import type { CalendarDateOption } from './calendarDateOption';

export interface DateMealSelectorProps {
  options: CalendarDateOption[];
  selectedDateKey: string;
  onSelectDate: (key: string) => void;
  mealType: MealType;
  onSelectMeal: (mealType: MealType) => void;
  /** Meals whose `scheduledFor` has already passed for the selected date (docs/04, menu-browse "Passed" edge case). */
  pastMeals: MealType[];
}
