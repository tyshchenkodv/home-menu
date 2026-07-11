import type { DomainTimestamp, Order } from './types';

export interface BatchNormalizationPatch {
  batchId: string;
  reservedDelta: number;
  consumedDelta: number;
}

export interface ConsumedNormalizationResult {
  shouldNormalize: boolean;
  orderPatch: { status: 'consumed' } | null;
  batchPatches: BatchNormalizationPatch[];
}

/**
 * Implements `docs/04-business-logic.md` "Automatic consumption": runs only
 * while the persisted status is `reserved` or `prepared` and `scheduledFor <
 * now`. Idempotent — calling it again on an already-`consumed` order (or one
 * still before `scheduledFor`) reports `shouldNormalize: false` and no
 * patches, per SPEC "Domain and data model" rule 6.
 *
 * Each order allocation moves from reserved to consumed on its batch:
 * `reservedQuantity -= quantity`, `consumedQuantity += quantity`. This
 * pure function computes the patches; the transaction layer applies them.
 */
export function computeConsumedNormalization(order: Order, now: DomainTimestamp): ConsumedNormalizationResult {
  const eligibleStatus = order.status === 'reserved' || order.status === 'prepared';
  const isPastSchedule = order.scheduledFor.toMillis() < now.toMillis();

  if (!eligibleStatus || !isPastSchedule) {
    return { shouldNormalize: false, orderPatch: null, batchPatches: [] };
  }

  const batchPatches = order.allocations.map(allocation => ({
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
