import { useEffect, useState } from 'react';

import type { OrderStatus } from '../../../domain/orders/types';
import {
  subscribeAdminBoardOrders,
  subscribeAdminHistoryOrders,
} from '../../../infrastructure/firebase/services/orderService';
import type { OrderWithId } from '../../../shared/types/order';
import type { AdminOrdersTab } from '../types/adminOrdersTab';
import type { UseAdminOrdersResult } from '../types/useAdminOrdersResult';

const LOADING_RESULT: UseAdminOrdersResult = { status: 'loading', orders: [], error: null };

/**
 * Subscribes to the orders the current admin-orders tab needs: the 4 active
 * Kanban statuses on `board`, or the caller-selected subset of the 4
 * terminal statuses on `history` (docs/design/screens/admin-orders.md).
 * `historyStatuses` should be a stable (memoized or module-level) array — it
 * is a hook dependency. `retryToken` is not read; changing it merely re-runs
 * the effect, so the error state's "Retry" action can force a fresh
 * subscription.
 */
export const useAdminOrders = (
  tab: AdminOrdersTab,
  historyStatuses: OrderStatus[],
  retryToken = 0,
): UseAdminOrdersResult => {
  const [result, setResult] = useState<UseAdminOrdersResult>(LOADING_RESULT);

  useEffect(() => {
    const onNext = (orders: OrderWithId[]) => {
      setResult({ status: 'ready', orders, error: null });
    };
    const onError = (error: Error) => {
      setResult({ status: 'error', orders: [], error });
    };

    if (tab === 'board') {
      return subscribeAdminBoardOrders(onNext, onError);
    }

    return subscribeAdminHistoryOrders(historyStatuses, onNext, onError);
  }, [tab, historyStatuses, retryToken]);

  return result;
};
