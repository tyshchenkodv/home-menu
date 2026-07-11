import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { canUserCancelOrder } from '../cancellationRules';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    userId: 'user-1',
    userDisplayName: 'Jane',
    dishId: 'dish-1',
    dishName: 'Pancakes',
    kind: 'ready',
    status: 'reserved',
    quantity: 2,
    mealType: 'breakfast',
    scheduledFor: { toMillis: () => 2000 },
    allocations: [{ batchId: 'batch-1', quantity: 2 }],
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

describe('canUserCancelOrder', () => {
  it('allows cancelling a reserved order while now < scheduledFor', () => {
    const order = makeOrder({ kind: 'ready', status: 'reserved', scheduledFor: { toMillis: () => 2000 } });

    expect(canUserCancelOrder(order, { toMillis: () => 1000 })).toBe(true);
  });

  it('forbids cancelling a reserved order once now >= scheduledFor', () => {
    const order = makeOrder({ kind: 'ready', status: 'reserved', scheduledFor: { toMillis: () => 1000 } });

    expect(canUserCancelOrder(order, { toMillis: () => 1000 })).toBe(false);
    expect(canUserCancelOrder(order, { toMillis: () => 2000 })).toBe(false);
  });

  it('allows cancelling a cook request while pending', () => {
    const order = makeOrder({ kind: 'cook', status: 'pending' });

    expect(canUserCancelOrder(order, { toMillis: () => 0 })).toBe(true);
  });

  it('allows cancelling a cook request while approved', () => {
    const order = makeOrder({ kind: 'cook', status: 'approved' });

    expect(canUserCancelOrder(order, { toMillis: () => 0 })).toBe(true);
  });

  it('forbids cancelling a cook request once cooking has started', () => {
    const order = makeOrder({ kind: 'cook', status: 'cooking' });

    expect(canUserCancelOrder(order, { toMillis: () => 0 })).toBe(false);
  });

  it('forbids cancelling a cook request once prepared', () => {
    const order = makeOrder({ kind: 'cook', status: 'prepared' });

    expect(canUserCancelOrder(order, { toMillis: () => 0 })).toBe(false);
  });

  it('forbids cancelling a ready order that is not reserved', () => {
    const order = makeOrder({ kind: 'ready', status: 'cancelled' });

    expect(canUserCancelOrder(order, { toMillis: () => 0 })).toBe(false);
  });

  it('forbids cancelling a cook request that is not pending/approved', () => {
    for (const status of ['rejected', 'cancelled', 'consumed'] as const) {
      const order = makeOrder({ kind: 'cook', status });
      expect(canUserCancelOrder(order, { toMillis: () => 0 })).toBe(false);
    }
  });
});
