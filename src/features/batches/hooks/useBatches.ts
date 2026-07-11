import { useEffect, useState } from 'react';

import { subscribeAllBatches } from '../../../infrastructure/firebase/services/batchService';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';

interface UseBatchesResult {
  status: 'loading' | 'error' | 'ready';
  batches: PreparedBatchWithId[];
  error: Error | null;
}

const LOADING_RESULT: UseBatchesResult = { status: 'loading', batches: [], error: null };

/**
 * Subscribes to all prepared batches, ordered by preparedAt descending
 * (newest first). Exposes a single loading/error/ready view model.
 *
 * Used by the admin batches screen to display all batches with their counters,
 * expiration status, and discard/register actions.
 */
export const useBatches = (retryToken = 0): UseBatchesResult => {
  const [result, setResult] = useState<UseBatchesResult>(LOADING_RESULT);

  useEffect(() => {
    const unsubscribe = subscribeAllBatches(
      batches => {
        setResult({ status: 'ready', batches, error: null });
      },
      error => {
        setResult({ status: 'error', batches: [], error: error instanceof Error ? error : new Error(String(error)) });
      },
    );

    return unsubscribe;
  }, [retryToken]);

  return result;
};
