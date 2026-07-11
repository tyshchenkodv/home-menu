import type { DishWithId } from '../../../shared/types/dish';

export type UseDishesStatus = 'loading' | 'error' | 'ready';

/** View model returned by the `useDishes` feature hook. */
export interface UseDishesResult {
  status: UseDishesStatus;
  dishes: DishWithId[];
  error: Error | null;
}
