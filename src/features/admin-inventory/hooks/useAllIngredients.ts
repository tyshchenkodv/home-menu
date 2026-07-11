import { useEffect, useState } from 'react';

import {
  subscribeActiveIngredients,
  subscribeArchivedIngredients,
} from '../../../infrastructure/firebase/services/ingredientService';
import type { UseIngredientsResult } from '../types/useIngredientsResult';

const LOADING_STATE: UseIngredientsResult = { status: 'loading', ingredients: [], error: null };

/**
 * Combines the active and archived ingredient feeds into a single
 * name-sorted list, for consumers (the history filter) that need every
 * ingredient regardless of archive state. Each feed subscribes once for the
 * lifetime of the hook; the combined result is only "ready" once both feeds
 * have emitted at least once, and surfaces the first error either feed
 * reports.
 */
export const useAllIngredients = (): UseIngredientsResult => {
  const [active, setActive] = useState<UseIngredientsResult>(LOADING_STATE);
  const [archived, setArchived] = useState<UseIngredientsResult>(LOADING_STATE);

  useEffect(() => {
    return subscribeActiveIngredients(
      ingredients => {
        setActive({ status: 'ready', ingredients, error: null });
      },
      error => {
        setActive({ status: 'error', ingredients: [], error });
      },
    );
  }, []);

  useEffect(() => {
    return subscribeArchivedIngredients(
      ingredients => {
        setArchived({ status: 'ready', ingredients, error: null });
      },
      error => {
        setArchived({ status: 'error', ingredients: [], error });
      },
    );
  }, []);

  if (active.status === 'error') {
    return active;
  }

  if (archived.status === 'error') {
    return archived;
  }

  if (active.status === 'loading' || archived.status === 'loading') {
    return LOADING_STATE;
  }

  const ingredients = [...active.ingredients, ...archived.ingredients].sort((a, b) => a.name.localeCompare(b.name));

  return { status: 'ready', ingredients, error: null };
};
