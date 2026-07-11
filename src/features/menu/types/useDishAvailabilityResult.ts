import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';
import type { MenuDishView } from './menuDishView';

export interface UseDishAvailabilityResult {
  status: 'loading' | 'ready' | 'error';
  views: MenuDishView[];
  error: Error | null;
  /**
   * Admin-only: expired (`expiresAt < now`), non-discarded batches backing
   * each dish, keyed by dish id. Derived from the same `batchesByDishId` and
   * `now` used for availability, but never affects `views` — availability
   * stays exactly as computed by `evaluateDishAvailability` regardless of
   * expiry (`docs/specifications/menu-expired-batch-banner/SPEC.md`).
   */
  expiredBatchesByDishId: Record<string, PreparedBatchWithId[]>;
}
