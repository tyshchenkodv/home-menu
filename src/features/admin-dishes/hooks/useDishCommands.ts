import { useCallback, useState } from 'react';

import {
  archiveDish,
  createDish,
  restoreDish,
  updateDish,
  type CreateDishInput,
  type UpdateDishInput,
} from '../../../infrastructure/firebase/services/dishService';

export interface UseDishCommandsResult {
  /** The dish id currently mid-command, or `null` when idle. */
  pendingDishId: string | null;
  create: (input: CreateDishInput, uid: string) => Promise<string>;
  update: (dishId: string, input: UpdateDishInput, uid: string) => Promise<void>;
  archive: (dishId: string, uid: string) => Promise<void>;
  restore: (dishId: string, uid: string) => Promise<void>;
}

/**
 * Wraps the four dish commands from `dishService.ts` with a shared
 * `pendingDishId` guard, so callers can disable controls for the dish
 * currently being mutated and prevent duplicate submits. Errors are
 * intentionally not caught here: they propagate to the caller, which maps
 * them to a translation key.
 */
export function useDishCommands(): UseDishCommandsResult {
  const [pendingDishId, setPendingDishId] = useState<string | null>(null);

  const run = useCallback(async <T>(dishId: string, command: () => Promise<T>): Promise<T> => {
    setPendingDishId(dishId);
    try {
      return await command();
    } finally {
      setPendingDishId(null);
    }
  }, []);

  const create = useCallback(
    (input: CreateDishInput, uid: string) => run('__creating__', () => createDish(input, uid)),
    [run],
  );

  const update = useCallback(
    (dishId: string, input: UpdateDishInput, uid: string) => run(dishId, () => updateDish(dishId, input, uid)),
    [run],
  );

  const archive = useCallback((dishId: string, uid: string) => run(dishId, () => archiveDish(dishId, uid)), [run]);

  const restore = useCallback((dishId: string, uid: string) => run(dishId, () => restoreDish(dishId, uid)), [run]);

  return { pendingDishId, create, update, archive, restore };
}
