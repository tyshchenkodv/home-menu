import { useEffect, useState } from 'react';

import { subscribeActiveDishes, subscribeArchivedDishes } from '../../../infrastructure/firebase/services/dishService';
import type { DishesTab } from '../types/dishesTab';
import type { UseDishesResult } from '../types/useDishesResult';

const LOADING_RESULT: UseDishesResult = { status: 'loading', dishes: [], error: null };

type TaggedResult = UseDishesResult & { tab: DishesTab };

/**
 * Subscribes to the active or archived dish feed for the given tab and
 * exposes a single loading/error/ready view model. Re-subscribes whenever
 * `tab` or `retryToken` changes and always unsubscribes the previous feed
 * first. `retryToken` lets the "Retry" action on the error state force a
 * fresh subscription without changing the tab.
 *
 * The emitted result is tagged with the tab it belongs to so a tab switch
 * reads as "loading" for the render(s) before the new subscription's first
 * snapshot arrives, without calling `setState` synchronously inside the
 * effect body.
 */
export const useDishes = (tab: DishesTab, retryToken = 0): UseDishesResult => {
  const [tagged, setTagged] = useState<TaggedResult>({ tab, ...LOADING_RESULT });

  useEffect(() => {
    const subscribe = tab === 'active' ? subscribeActiveDishes : subscribeArchivedDishes;

    const unsubscribe = subscribe(
      dishes => {
        setTagged({ tab, status: 'ready', dishes, error: null });
      },
      error => {
        setTagged({ tab, status: 'error', dishes: [], error });
      },
    );

    return unsubscribe;
  }, [tab, retryToken]);

  if (tagged.tab !== tab) {
    return LOADING_RESULT;
  }

  return tagged;
};
