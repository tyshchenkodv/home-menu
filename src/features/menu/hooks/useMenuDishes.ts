import { useEffect, useState } from 'react';

import type { MealType } from '../../../domain/orders/types';
import { subscribeActiveDishes } from '../../../infrastructure/firebase/services/dishService';
import type { UseMenuDishesResult } from '../types/useMenuDishesResult';

const LOADING_RESULT: UseMenuDishesResult = { status: 'loading', dishes: [], error: null };

type TaggedResult = UseMenuDishesResult & { mealType: MealType };

/**
 * Subscribes to active dishes and narrows them to the ones offered for
 * `mealType` (docs/04 "Building the menu" step 1: "loads non-archived dishes
 * that support the selected meal"). The date itself does not filter which
 * dishes appear — only which meal's recipe/availability is being browsed —
 * so this hook does not take a date parameter.
 *
 * The emitted result is tagged with the `mealType` it belongs to (mirroring
 * `admin-dishes/hooks/useDishes.ts`), so a meal switch reads as "loading" for
 * the render(s) before the new subscription's first snapshot arrives,
 * without calling `setState` synchronously inside the effect body.
 */
export const useMenuDishes = (mealType: MealType): UseMenuDishesResult => {
  const [tagged, setTagged] = useState<TaggedResult>({ mealType, ...LOADING_RESULT });

  useEffect(() => {
    return subscribeActiveDishes(
      dishes => {
        setTagged({
          mealType,
          status: 'ready',
          dishes: dishes.filter(dish => dish.mealTypes.includes(mealType)),
          error: null,
        });
      },
      error => {
        setTagged({ mealType, status: 'error', dishes: [], error });
      },
    );
  }, [mealType]);

  if (tagged.mealType !== mealType) {
    return LOADING_RESULT;
  }

  return tagged;
};
