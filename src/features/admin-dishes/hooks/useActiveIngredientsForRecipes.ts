import { useEffect, useState } from 'react';

import { subscribeActiveIngredients } from '../../../infrastructure/firebase/services/ingredientService';
import type { IngredientWithId } from '../../../shared/types/ingredient';

export interface UseActiveIngredientsForRecipesResult {
  status: 'loading' | 'error' | 'ready';
  ingredients: IngredientWithId[];
}

const LOADING_RESULT: UseActiveIngredientsForRecipesResult = { status: 'loading', ingredients: [] };

/**
 * Subscribes to active ingredients for two dish-feature needs: the recipe
 * row ingredient picker in `DishFormDialog` and the current-stock snapshot
 * `evaluateDishAvailability` needs to compute each dish card's chip. Archived
 * ingredients are intentionally excluded from both uses.
 */
export const useActiveIngredientsForRecipes = (): UseActiveIngredientsForRecipesResult => {
  const [result, setResult] = useState<UseActiveIngredientsForRecipesResult>(LOADING_RESULT);

  useEffect(() => {
    return subscribeActiveIngredients(
      ingredients => {
        setResult({ status: 'ready', ingredients });
      },
      () => {
        setResult({ status: 'error', ingredients: [] });
      },
    );
  }, []);

  return result;
};
