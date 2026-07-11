import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { computeManualConsumption } from '../manualConsumption';

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

describe('computeManualConsumption', () => {
  it('is eligible for a reserved order regardless of scheduledFor (no time gate)', () => {
    const order = makeOrder({ status: 'reserved', scheduledFor: { toMillis: () => 999_999_999 } });

    const result = computeManualConsumption(order);

    expect(result).toEqual({
      shouldNormalize: true,
      orderPatch: { status: 'consumed' },
      batchPatches: [
        { batchId: 'batch-1', reservedDelta: -2, consumedDelta: 2 },
        { batchId: 'batch-2', reservedDelta: -1, consumedDelta: 1 },
      ],
    });
  });

  it('is eligible for a prepared order regardless of scheduledFor', () => {
    const order = makeOrder({
      kind: 'cook',
      status: 'prepared',
      scheduledFor: { toMillis: () => 999_999_999 },
      allocations: [{ batchId: 'batch-3', quantity: 3 }],
    });

    const result = computeManualConsumption(order);

    expect(result.shouldNormalize).toBe(true);
    expect(result.orderPatch).toEqual({ status: 'consumed' });
    expect(result.batchPatches).toEqual([{ batchId: 'batch-3', reservedDelta: -3, consumedDelta: 3 }]);
  });

  it('is a no-op for any other status', () => {
    for (const status of ['pending', 'approved', 'cooking', 'rejected', 'cancelled', 'consumed'] as const) {
      const order = makeOrder({ status });
      const result = computeManualConsumption(order);
      expect(result).toEqual({ shouldNormalize: false, orderPatch: null, batchPatches: [] });
    }
  });
});
