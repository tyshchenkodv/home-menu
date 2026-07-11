import { useEffect, useState } from 'react';

import { isLowStock } from '../../../../domain/inventory/isLowStock';
import { subscribeAdminBoardOrders } from '../../../../infrastructure/firebase/services/orderService';
import { subscribeAllIngredients } from '../../../../infrastructure/firebase/services/ingredientService';
import type { NavBadgeKey } from '../types/navigationDestination';

/** Live counts keyed by `NavBadgeKey`, rendered as nav item badges. */
export type NavBadgeCounts = Record<NavBadgeKey, number>;

const ZERO_COUNTS: NavBadgeCounts = { pendingRequests: 0, lowStock: 0 };

/**
 * Subscribes to the pending-cooking-requests count and the low-stock
 * ingredient count for the admin nav badges, reusing the same
 * `subscribeAdminBoardOrders`/`subscribeAllIngredients` infrastructure
 * subscriptions the admin-orders and admin-dashboard features already use
 * (no new Firestore query). Only subscribes while `enabled` is true (the
 * shell only needs these counts for an authenticated admin), and stays
 * resilient to subscription errors by leaving the last known count in place.
 */
export const useNavBadgeCounts = (enabled: boolean): NavBadgeCounts => {
  const [counts, setCounts] = useState<NavBadgeCounts>(ZERO_COUNTS);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribeAdminBoardOrders(
      orders => {
        const pendingRequests = orders.filter(order => order.status === 'pending').length;
        setCounts(previous => ({ ...previous, pendingRequests }));
      },
      () => undefined,
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribeAllIngredients(
      ingredients => {
        const lowStock = ingredients.filter(isLowStock).length;
        setCounts(previous => ({ ...previous, lowStock }));
      },
      () => undefined,
    );
  }, [enabled]);

  return enabled ? counts : ZERO_COUNTS;
};
