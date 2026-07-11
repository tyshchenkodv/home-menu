import type { Order } from './types';
import type { BatchNormalizationPatch, ConsumedNormalizationResult } from './normalization';

/**
 * Implements the admin "mark reserved consumed" capability (SPEC Goal 14,
 * `docs/specifications/mvp-audit-remediation/PLAN.md` T5.8): identical to
 * `computeConsumedNormalization`'s `reserved`/`prepared` → `consumed` move and
 * batch reserved→consumed deltas, but with **no time gate** — an admin may
 * mark an order consumed at any time, not only once `scheduledFor` has
 * passed. Any other status is a no-op, mirroring
 * `computeConsumedNormalization`'s ineligible-input shape so callers can
 * share the same "no-op" handling.
 */
export function computeManualConsumption(order: Order): ConsumedNormalizationResult {
  const eligibleStatus = order.status === 'reserved' || order.status === 'prepared';

  if (!eligibleStatus) {
    return { shouldNormalize: false, orderPatch: null, batchPatches: [] };
  }

  const batchPatches: BatchNormalizationPatch[] = order.allocations.map(allocation => ({
    batchId: allocation.batchId,
    reservedDelta: -allocation.quantity,
    consumedDelta: allocation.quantity,
  }));

  return {
    shouldNormalize: true,
    orderPatch: { status: 'consumed' },
    batchPatches,
  };
}
