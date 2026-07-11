import { useEffect } from 'react';

import { normalizeConsumedOrders } from '../../../infrastructure/firebase/services/orderTransactions';
import { useAuth } from '../../auth/useAuth';

/**
 * Triggers `normalizeConsumedOrders` once whenever the History tab becomes
 * active (docs/04-business-logic.md "Automatic consumption": "a later
 * administrator view ... may normalize persisted counters"). The
 * normalization batch is idempotent, so re-triggering it (e.g. re-opening
 * the tab) is always safe; failures are swallowed here — normalization is a
 * best-effort background sweep, not something that should block the History
 * list from rendering the orders it can already see.
 */
export const useHistoryNormalization = (enabled: boolean): void => {
  const { user } = useAuth();
  const adminUid = user?.uid ?? '';

  useEffect(() => {
    if (!enabled || !adminUid) {
      return;
    }

    void normalizeConsumedOrders(Date.now(), adminUid).catch(() => {
      // Best-effort: a failed sweep just leaves stale counters for the next attempt.
    });
  }, [enabled, adminUid]);
};
