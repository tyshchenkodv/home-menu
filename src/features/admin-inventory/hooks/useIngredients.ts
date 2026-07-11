import { useEffect, useState } from 'react';

import {
  subscribeActiveIngredients,
  subscribeArchivedIngredients,
} from '../../../infrastructure/firebase/services/ingredientService';
import { notifyError } from '../../../shared/notifications/notify';
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
 *
 * `reloadKey` is not read by the effect body; bumping it from the caller
 * (e.g. the error state's retry action) forces a fresh re-subscription
 * without introducing a separate imperative reload API.
 */
export const useIngredients = (tab: InventoryTab, reloadKey = 0): UseIngredientsResult => {
  const [tagged, setTagged] = useState<TaggedResult>({ tab, ...LOADING_RESULT });

  useEffect(() => {
    const subscribe = tab === 'active' ? subscribeActiveIngredients : subscribeArchivedIngredients;

    const unsubscribe = subscribe(
      ingredients => {
        setTagged({ tab, status: 'ready', ingredients, error: null });
      },
      error => {
        setTagged({ tab, status: 'error', ingredients: [], error });
        notifyError(error);
      },
    );

    return unsubscribe;
  }, [tab, reloadKey]);

  if (tagged.tab !== tab) {
    return LOADING_RESULT;
  }

  return tagged;
};
