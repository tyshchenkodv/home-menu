import { useEffect, useState } from 'react';

import { evaluateDishAvailability } from '../../../domain/dishes/evaluateDishAvailability';
import type { AvailabilityIngredient } from '../../../domain/dishes/types';
import { selectExpiredBackingBatches } from '../../../domain/menu/selectExpiredBackingBatches';
import type { DomainTimestamp } from '../../../domain/batches/types';
import { subscribeAvailableBatchesForDish } from '../../../infrastructure/firebase/services/batchService';
import { subscribeActiveIngredients } from '../../../infrastructure/firebase/services/ingredientService';
import type { DishWithId } from '../../../shared/types/dish';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';
import type { UseDishAvailabilityResult } from '../types/useDishAvailabilityResult';

const LOADING_RESULT: UseDishAvailabilityResult = {
  status: 'loading',
  views: [],
  error: null,
  expiredBatchesByDishId: {},
};

/**
 * Combines the live ingredient feed with a per-dish `available`-batches feed
 * to derive `DishAvailability` for every candidate dish (`evaluateDishAvailability`,
 * `docs/03-data-model.md` "Derived availability"). Implements docs/04
 * "Building the menu" steps 2–5: dishes with an empty recipe never appear to
 * users (this task's resolution of the "not configured" state — it is
 * described as admin-only elsewhere in the transcription), and a dish is
 * kept only when it either has ready portions or can currently be cooked.
 */
export const useDishAvailability = (dishes: DishWithId[]): UseDishAvailabilityResult => {
  const [ingredients, setIngredients] = useState<AvailabilityIngredient[] | null>(null);
  const [ingredientsError, setIngredientsError] = useState<Error | null>(null);
  const [batchesByDishId, setBatchesByDishId] = useState<Record<string, PreparedBatchWithId[]>>({});
  const [batchesError, setBatchesError] = useState<Error | null>(null);
  // Lazy initializer: read once on mount, not on every render (React's
  // purity rule forbids calling the impure `Date.now()` directly in the
  // render body). Shared as the single "now" for both availability-adjacent
  // computations and the admin expired-batch selector below.
  const [nowMillis] = useState(() => Date.now());

  useEffect(() => {
    return subscribeActiveIngredients(
      list => {
        setIngredients(
          list.map(ingredient => ({
            ingredientId: ingredient.id,
            quantity: ingredient.quantity,
            isPresent: ingredient.isPresent,
          })),
        );
      },
      error => {
        setIngredientsError(error);
      },
    );
  }, []);

  const dishIdsKey = dishes
    .map(dish => dish.id)
    .sort((a, b) => a.localeCompare(b))
    .join(',');

  useEffect(() => {
    const dishIds = dishIdsKey.length > 0 ? dishIdsKey.split(',') : [];
    const unsubscribes = dishIds.map(dishId =>
      subscribeAvailableBatchesForDish(
        dishId,
        batches => {
          setBatchesByDishId(current => ({ ...current, [dishId]: batches }));
        },
        error => {
          setBatchesError(error);
        },
      ),
    );

    return () => {
      unsubscribes.forEach(unsubscribe => {
        unsubscribe();
      });
    };
  }, [dishIdsKey]);

  if (ingredientsError ?? batchesError) {
    return { status: 'error', views: [], error: ingredientsError ?? batchesError, expiredBatchesByDishId: {} };
  }

  if (ingredients === null) {
    return LOADING_RESULT;
  }

  const views = dishes
    .filter(dish => dish.recipeItems.length > 0)
    .map(dish => ({
      dish,
      availability: evaluateDishAvailability(dish, batchesByDishId[dish.id] ?? [], ingredients),
    }))
    .filter(view => view.availability.readyQuantity > 0 || view.availability.canCook);

  const now: DomainTimestamp = { toMillis: () => nowMillis };
  const expiredBatchesByDishId: Record<string, PreparedBatchWithId[]> = {};
  for (const [dishId, batches] of Object.entries(batchesByDishId)) {
    const expired = selectExpiredBackingBatches(batches, now);
    if (expired.length > 0) {
      expiredBatchesByDishId[dishId] = expired;
    }
  }

  return { status: 'ready', views, error: null, expiredBatchesByDishId };
};
