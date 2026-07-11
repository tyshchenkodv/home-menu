import type { DishWithId } from '../../../shared/types/dish';

export interface UseMenuDishesResult {
  status: 'loading' | 'ready' | 'error';
  dishes: DishWithId[];
  error: Error | null;
}
