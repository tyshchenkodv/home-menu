import { useEffect, useState } from 'react';

import {
  subscribeActiveIngredients,
  subscribeArchivedIngredients,
} from '../../../infrastructure/firebase/services/ingredientService';
import type { InventoryTab } from '../types/inventoryTab';
import type { UseIngredientsResult } from '../types/useIngredientsResult';

const LOADING_RESULT: UseIngredientsResult = { status: 'loading', ingredients: [], error: null };

type TaggedResult = UseIngredientsResult & { tab: InventoryTab };

/**
 * Subscribes to the active or archived ingredient feed for the given tab and
 * exposes a single loading/error/ready view model. Re-subscribes whenever
 * `tab` changes and always unsubscribes the previous feed first.
 *
 * The emitted result is tagged with the tab it belongs to so a tab switch
 * reads as "loading" for the render(s) before the new subscription's first
 * snapshot arrives, without calling `setState` synchronously inside the
 * effect body.
 */
export const useIngredients = (tab: InventoryTab): UseIngredientsResult => {
  const [tagged, setTagged] = useState<TaggedResult>({ tab, ...LOADING_RESULT });

  useEffect(() => {
    const subscribe = tab === 'active' ? subscribeActiveIngredients : subscribeArchivedIngredients;

    const unsubscribe = subscribe(
      ingredients => {
        setTagged({ tab, status: 'ready', ingredients, error: null });
      },
      error => {
        setTagged({ tab, status: 'error', ingredients: [], error });
      },
    );

    return unsubscribe;
  }, [tab]);

  if (tagged.tab !== tab) {
    return LOADING_RESULT;
  }

  return tagged;
};
