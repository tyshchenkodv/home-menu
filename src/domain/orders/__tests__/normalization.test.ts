import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { computeConsumedNormalization } from '../normalization';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    userId: 'user-1',
    userDisplayName: 'Jane',
    dishId: 'dish-1',
    dishName: 'Pancakes',
    kind: 'ready',
    status: 'reserved',
    quantity: 3,
    mealType: 'breakfast',
    scheduledFor: { toMillis: () => 1000 },
    allocations: [
      { batchId: 'batch-1', quantity: 2 },
      { batchId: 'batch-2', quantity: 1 },
    ],
    rejectionReason: null,
    preparedBatchId: null,
    preparedBatchNumber: null,
    createdAt: { toMillis: () => 0 },
    createdBy: 'user-1',
    updatedAt: { toMillis: () => 0 },
    updatedBy: 'user-1',
    ...overrides,
  };
}

describe('computeConsumedNormalization', () => {
  it('normalizes a reserved order past scheduledFor into consumed, moving each allocation', () => {
    const order = makeOrder({ status: 'reserved', scheduledFor: { toMillis: () => 1000 } });

    const result = computeConsumedNormalization(order, { toMillis: () => 2000 });

    expect(result).toEqual({
      shouldNormalize: true,
      orderPatch: { status: 'consumed' },
      batchPatches: [
        { batchId: 'batch-1', reservedDelta: -2, consumedDelta: 2 },
        { batchId: 'batch-2', reservedDelta: -1, consumedDelta: 1 },
      ],
    });
  });

  it('normalizes a prepared order past scheduledFor into consumed', () => {
    const order = makeOrder({
      kind: 'cook',
      status: 'prepared',
      scheduledFor: { toMillis: () => 1000 },
      allocations: [{ batchId: 'batch-3', quantity: 3 }],
    });

    const result = computeConsumedNormalization(order, { toMillis: () => 1500 });

    expect(result.shouldNormalize).toBe(true);
    expect(result.orderPatch).toEqual({ status: 'consumed' });
    expect(result.batchPatches).toEqual([{ batchId: 'batch-3', reservedDelta: -3, consumedDelta: 3 }]);
  });

  it('does not normalize before scheduledFor', () => {
    const order = makeOrder({ status: 'reserved', scheduledFor: { toMillis: () => 2000 } });

    const result = computeConsumedNormalization(order, { toMillis: () => 1000 });

    expect(result).toEqual({ shouldNormalize: false, orderPatch: null, batchPatches: [] });
  });

  it('does not normalize at exactly scheduledFor', () => {
    const order = makeOrder({ status: 'reserved', scheduledFor: { toMillis: () => 1000 } });

    const result = computeConsumedNormalization(order, { toMillis: () => 1000 });

    expect(result.shouldNormalize).toBe(false);
  });

  it('is idempotent: already-consumed orders are left untouched', () => {
    const order = makeOrder({ status: 'consumed', scheduledFor: { toMillis: () => 1000 } });

    const result = computeConsumedNormalization(order, { toMillis: () => 5000 });

    expect(result).toEqual({ shouldNormalize: false, orderPatch: null, batchPatches: [] });
  });

  it('does not normalize other non-terminal statuses (pending, approved, cooking)', () => {
    for (const status of ['pending', 'approved', 'cooking'] as const) {
      const order = makeOrder({ status, scheduledFor: { toMillis: () => 1000 } });
      const result = computeConsumedNormalization(order, { toMillis: () => 5000 });
      expect(result.shouldNormalize).toBe(false);
    }
  });

  it('does not normalize a cancelled or rejected order', () => {
    for (const status of ['cancelled', 'rejected'] as const) {
      const order = makeOrder({ status, scheduledFor: { toMillis: () => 1000 } });
      const result = computeConsumedNormalization(order, { toMillis: () => 5000 });
      expect(result.shouldNormalize).toBe(false);
    }
  });
});
