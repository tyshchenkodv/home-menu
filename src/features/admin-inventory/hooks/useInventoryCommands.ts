import { useCallback, useState } from 'react';

import {
  correctIngredientQuantity,
  markIngredientAbsent,
  markIngredientPresent,
  restockIngredient,
} from '../../../infrastructure/firebase/services/inventoryTransactions';

export interface UseInventoryCommandsResult {
  /** The ingredient id currently mid-transaction, or `null` when idle. */
  pendingIngredientId: string | null;
  restock: (ingredientId: string, deltaQuantity: number, uid: string) => Promise<void>;
  correct: (ingredientId: string, exactBalance: number, reason: string, uid: string) => Promise<void>;
  markPresent: (ingredientId: string, uid: string) => Promise<void>;
  markAbsent: (ingredientId: string, uid: string) => Promise<void>;
}

/**
 * Wraps the four inventory transaction commands from
 * `inventoryTransactions.ts` with a shared `pendingIngredientId` guard, so
 * callers (dialogs and direct card actions) can disable controls for the
 * ingredient currently being mutated and prevent duplicate submits. Errors
 * are intentionally not caught here: they propagate to the caller, which
 * maps them to a translation key with `resolveErrorTranslationKey` — the
 * same convention `IngredientFormDialog` already uses for create/edit.
 */
export function useInventoryCommands(): UseInventoryCommandsResult {
  const [pendingIngredientId, setPendingIngredientId] = useState<string | null>(null);

  const run = useCallback(async (ingredientId: string, command: () => Promise<void>): Promise<void> => {
    setPendingIngredientId(ingredientId);
    try {
      await command();
    } finally {
      setPendingIngredientId(null);
    }
  }, []);

  const restock = useCallback(
    (ingredientId: string, deltaQuantity: number, uid: string) =>
      run(ingredientId, () => restockIngredient(ingredientId, deltaQuantity, uid)),
    [run],
  );

  const correct = useCallback(
    (ingredientId: string, exactBalance: number, reason: string, uid: string) =>
      run(ingredientId, () => correctIngredientQuantity(ingredientId, exactBalance, reason, uid)),
    [run],
  );

  const markPresent = useCallback(
    (ingredientId: string, uid: string) => run(ingredientId, () => markIngredientPresent(ingredientId, uid)),
    [run],
  );

  const markAbsent = useCallback(
    (ingredientId: string, uid: string) => run(ingredientId, () => markIngredientAbsent(ingredientId, uid)),
    [run],
  );

  return { pendingIngredientId, restock, correct, markPresent, markAbsent };
}
