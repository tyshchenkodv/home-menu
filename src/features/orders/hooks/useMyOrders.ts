import { useEffect, useState } from 'react';

import { getBatchesByIds } from '../../../infrastructure/firebase/services/batchService';
import { subscribeOwnOrders } from '../../../infrastructure/firebase/services/orderService';
import type { UseMyOrdersResult } from '../types/useMyOrdersResult';

const LOADING_RESULT: UseMyOrdersResult = { status: 'loading', orders: [], batchesById: new Map(), error: null };

/**
 * Subscribes to the signed-in user's own orders and, best-effort, fetches
 * the batches referenced by every `reserved` allocation — used by
 * `OrderCard` to show the batch-expired/discarded warning (SPEC "Domain and
 * data model" rule 5). A batch-lookup failure does not fail the whole
 * subscription; the warning is simply omitted for that render.
 *
 * `retryToken` is not read; changing it merely re-runs the effect, so the
 * screen's "Retry" action can force a fresh subscription after an error.
 */
export const useMyOrders = (userId: string, retryToken = 0): UseMyOrdersResult => {
  const [result, setResult] = useState<UseMyOrdersResult>(LOADING_RESULT);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeOwnOrders(
      userId,
      orders => {
        const batchIds = Array.from(
          new Set(
            orders
              .filter(order => order.kind === 'ready' && order.status === 'reserved')
              .flatMap(order => order.allocations.map(allocation => allocation.batchId)),
          ),
        );

        if (batchIds.length === 0) {
          setResult({ status: 'ready', orders, batchesById: new Map(), error: null });
          return;
        }

        getBatchesByIds(batchIds)
          .then(batches => {
            setResult({
              status: 'ready',
              orders,
              batchesById: new Map(batches.map(batch => [batch.id, batch])),
              error: null,
            });
          })
          .catch(() => {
            setResult({ status: 'ready', orders, batchesById: new Map(), error: null });
          });
      },
      error => {
        setResult({ status: 'error', orders: [], batchesById: new Map(), error });
      },
    );
  }, [userId, retryToken]);

  if (!userId) {
    return LOADING_RESULT;
  }

  return result;
};
