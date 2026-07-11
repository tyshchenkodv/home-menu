import { describe, expect, it } from 'vitest';

import { summarizeOwnSlotHoldings, type OwnHoldingOrder } from '../summarizeOwnSlotHoldings';

const TARGET = { dishId: 'dish-risotto', slotKey: '2026-07-11#breakfast' };

const buildOrder = (overrides: Partial<OwnHoldingOrder> = {}): OwnHoldingOrder => ({
  dishId: TARGET.dishId,
  slotKey: TARGET.slotKey,
  kind: 'ready',
  status: 'reserved',
  quantity: 1,
  ...overrides,
});

describe('summarizeOwnSlotHoldings', () => {
  it('sums multiple reserved ready orders for the matching dish and slot into reservedQuantity', () => {
    const orders: OwnHoldingOrder[] = [buildOrder({ quantity: 2 }), buildOrder({ quantity: 3 })];

    expect(summarizeOwnSlotHoldings(orders, TARGET)).toEqual({ reservedQuantity: 5, requestedQuantity: 0 });
  });

  it('sums active cook orders (pending/approved/cooking/prepared) into requestedQuantity', () => {
    const orders: OwnHoldingOrder[] = [
      buildOrder({ kind: 'cook', status: 'pending', quantity: 1 }),
      buildOrder({ kind: 'cook', status: 'approved', quantity: 2 }),
      buildOrder({ kind: 'cook', status: 'cooking', quantity: 3 }),
      buildOrder({ kind: 'cook', status: 'prepared', quantity: 4 }),
    ];

    expect(summarizeOwnSlotHoldings(orders, TARGET)).toEqual({ reservedQuantity: 0, requestedQuantity: 10 });
  });

  it('excludes orders for a different dishId', () => {
    const orders: OwnHoldingOrder[] = [buildOrder({ dishId: 'dish-other', quantity: 5 })];

    expect(summarizeOwnSlotHoldings(orders, TARGET)).toEqual({ reservedQuantity: 0, requestedQuantity: 0 });
  });

  it('excludes orders for a different slotKey (different date or meal)', () => {
    const orders: OwnHoldingOrder[] = [
      buildOrder({ slotKey: '2026-07-12#breakfast', quantity: 5 }),
      buildOrder({ slotKey: '2026-07-11#lunch', quantity: 5 }),
    ];

    expect(summarizeOwnSlotHoldings(orders, TARGET)).toEqual({ reservedQuantity: 0, requestedQuantity: 0 });
  });

  it('excludes terminal statuses (consumed/rejected/cancelled) and cancelled ready orders', () => {
    const orders: OwnHoldingOrder[] = [
      buildOrder({ kind: 'ready', status: 'cancelled', quantity: 5 }),
      buildOrder({ kind: 'ready', status: 'consumed', quantity: 5 }),
      buildOrder({ kind: 'cook', status: 'rejected', quantity: 5 }),
      buildOrder({ kind: 'cook', status: 'cancelled', quantity: 5 }),
      buildOrder({ kind: 'cook', status: 'consumed', quantity: 5 }),
    ];

    expect(summarizeOwnSlotHoldings(orders, TARGET)).toEqual({ reservedQuantity: 0, requestedQuantity: 0 });
  });

  it('returns zeroes for empty input', () => {
    expect(summarizeOwnSlotHoldings([], TARGET)).toEqual({ reservedQuantity: 0, requestedQuantity: 0 });
  });
});
