import { useEffect, useState } from 'react';

import { subscribeMovements } from '../../../infrastructure/firebase/services/inventoryMovementService';
import type { UseInventoryMovementsResult } from '../types/useInventoryMovementsResult';

const LOADING_RESULT: UseInventoryMovementsResult = { status: 'loading', movements: [], error: null };

type TaggedResult = UseInventoryMovementsResult & { ingredientId: string | undefined };

/**
 * Subscribes to the append-only inventory movement feed, optionally narrowed
 * to a single ingredient, and exposes a single loading/error/ready view
 * model. Re-subscribes whenever `ingredientId` changes and always
 * unsubscribes the previous feed first.
 *
 * The emitted result is tagged with the `ingredientId` it belongs to so a
 * filter change reads as "loading" for the render(s) before the new
 * subscription's first snapshot arrives, without calling `setState`
 * synchronously inside the effect body.
 *
 * `reloadKey` is not read by the effect body; bumping it from the caller
 * (e.g. the error state's retry action) forces a fresh re-subscription
 * without introducing a separate imperative reload API.
 */
export const useInventoryMovements = (ingredientId?: string, reloadKey = 0): UseInventoryMovementsResult => {
  const [tagged, setTagged] = useState<TaggedResult>({ ingredientId, ...LOADING_RESULT });

  useEffect(() => {
    const unsubscribe = subscribeMovements(
      { ingredientId },
      movements => {
        setTagged({ ingredientId, status: 'ready', movements, error: null });
      },
      error => {
        setTagged({ ingredientId, status: 'error', movements: [], error });
      },
    );

    return unsubscribe;
  }, [ingredientId, reloadKey]);

  if (tagged.ingredientId !== ingredientId) {
    return LOADING_RESULT;
  }

  return tagged;
};
