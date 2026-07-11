import { useEffect, useMemo, useState } from 'react';

import type { DomainTimestamp } from '../../../domain/batches/types';
import { isBatchExpired } from '../../../domain/batches/expiration';
import { subscribeAdminBoardOrders } from '../../../infrastructure/firebase/services/orderService';
import { subscribeAllBatches } from '../../../infrastructure/firebase/services/batchService';
import { subscribeAllIngredients } from '../../../infrastructure/firebase/services/ingredientService';
import type { OrderWithId } from '../../../shared/types/order';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';
import type { IngredientWithId } from '../../../shared/types/ingredient';

export interface DashboardData {
  pendingRequests: number;
  inProgress: number;
  lowStockCount: number;
  expiredBatchCount: number;
  readyPortionsTotal: number;
}

interface UseDashboardDataResult {
  status: 'loading' | 'error' | 'ready';
  data: DashboardData;
  error: Error | null;
}

const EMPTY_DATA: DashboardData = {
  pendingRequests: 0,
  inProgress: 0,
  lowStockCount: 0,
  expiredBatchCount: 0,
  readyPortionsTotal: 0,
};

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));

/**
 * Aggregates dashboard summary data from multiple subscriptions:
 * - Pending cooking requests (kind='cook', status='pending')
 * - In-progress orders (status='cooking')
 * - Low-stock ingredients (quantity below threshold, if any)
 * - Expired batches (expiresAt < now)
 * - Ready portions total (sum of availableQuantity across non-discarded batches)
 *
 * Subscribes to all feeds independently; a failure on any one of them puts
 * the whole hook into the `error` status (the dashboard has no meaningful
 * partial view once a feed it depends on stops updating). The combined
 * `DashboardData` is derived with `useMemo` rather than a fourth effect, so
 * recomputing it does not trigger an extra render pass.
 */
export const useDashboardData = (retryToken = 0): UseDashboardDataResult => {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [batches, setBatches] = useState<PreparedBatchWithId[]>([]);
  const [ingredients, setIngredients] = useState<IngredientWithId[]>([]);
  const [error, setError] = useState<Error | null>(null);
  // Captured once at mount (a lazy initializer keeps the impure Date.now() out
  // of render); the dashboard's expired-batch count is evaluated against it.
  const [nowMillis] = useState(() => Date.now());

  // Subscribe to orders
  useEffect(() => {
    return subscribeAdminBoardOrders(
      fetchedOrders => {
        setOrders(fetchedOrders);
        setError(null);
      },
      subscribeError => {
        setError(toError(subscribeError));
      },
    );
  }, [retryToken]);

  // Subscribe to batches
  useEffect(() => {
    return subscribeAllBatches(
      fetchedBatches => {
        setBatches(fetchedBatches);
        setError(null);
      },
      subscribeError => {
        setError(toError(subscribeError));
      },
    );
  }, [retryToken]);

  // Subscribe to ingredients
  useEffect(() => {
    return subscribeAllIngredients(
      fetchedIngredients => {
        setIngredients(fetchedIngredients);
        setError(null);
      },
      subscribeError => {
        setError(toError(subscribeError));
      },
    );
  }, [retryToken]);

  return useMemo<UseDashboardDataResult>(() => {
    if (error) {
      return { status: 'error', data: EMPTY_DATA, error };
    }

    const now: DomainTimestamp = { toMillis: () => nowMillis };

    const pendingRequests = orders.filter(order => order.status === 'pending').length;
    const inProgress = orders.filter(order => order.status === 'cooking').length;

    const lowStockCount = ingredients.filter(ingredient => {
      if (ingredient.trackingMode === 'presence') return false;
      if (ingredient.lowStockThreshold === null) return false;
      return ingredient.quantity !== null && ingredient.quantity < ingredient.lowStockThreshold;
    }).length;

    const expiredBatchCount = batches.filter(batch => isBatchExpired(batch.expiresAt, now)).length;

    const readyPortionsTotal = batches
      .filter(batch => batch.status !== 'discarded')
      .reduce((sum, batch) => sum + batch.availableQuantity, 0);

    return {
      status: 'ready',
      data: {
        pendingRequests,
        inProgress,
        lowStockCount,
        expiredBatchCount,
        readyPortionsTotal,
      },
      error: null,
    };
  }, [orders, batches, ingredients, error, nowMillis]);
};
