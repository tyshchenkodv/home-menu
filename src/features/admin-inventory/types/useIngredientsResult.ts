import type { IngredientWithId } from '../../../shared/types/ingredient';

export type UseIngredientsStatus = 'loading' | 'error' | 'ready';

/** View model returned by the `useIngredients` feature hook. */
export interface UseIngredientsResult {
  status: UseIngredientsStatus;
  ingredients: IngredientWithId[];
  error: Error | null;
}
