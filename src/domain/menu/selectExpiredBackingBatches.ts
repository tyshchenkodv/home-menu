import { isBatchExpired } from '../batches/expiration';
import type { DomainTimestamp, PreparedBatch } from '../batches/types';

/**
 * Selects the batches, out of a dish's backing batches, that are expired
 * (`isBatchExpired`) and not yet discarded — the admin-only "expired stock
 * awaiting discard" set behind the menu-browse expired-batch banner
 * (`docs/design/screens/menu-browse.md`). Pure and framework-free; reuses
 * `isBatchExpired` as the single source of truth for "expired" instead of
 * redefining the predicate.
 */
export function selectExpiredBackingBatches<TBatch extends PreparedBatch>(
  batches: TBatch[],
  now: DomainTimestamp,
): TBatch[] {
  return batches.filter(batch => isBatchExpired(batch.expiresAt, now) && batch.status !== 'discarded');
}
