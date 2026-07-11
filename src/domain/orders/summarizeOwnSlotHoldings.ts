import type { OrderKind, OrderStatus } from './types';

/**
 * Minimal shape of the signed-in user's own order needed to summarize their
 * holdings for one menu slot (dish + Kyiv calendar date + meal). Framework-
 * and timezone-free: the caller reduces a Firestore `OrderWithId` down to
 * this shape, computing `slotKey` from `scheduledFor` before calling in.
 */
export interface OwnHoldingOrder {
  dishId: string;
  slotKey: string;
  kind: OrderKind;
  status: OrderStatus;
  quantity: number;
}

export interface SlotHoldingsSummary {
  reservedQuantity: number;
  requestedQuantity: number;
}

/** Every non-terminal `cook` status — an in-flight cooking request the user is still owed. */
const ACTIVE_COOK_STATUSES: OrderStatus[] = ['pending', 'approved', 'cooking', 'prepared'];

/**
 * Sums the signed-in user's own orders that match `target`'s exact dish +
 * slot into two SPEC-defined hint quantities (see
 * `docs/specifications/menu-own-reservation-hint/SPEC.md` "What counts"):
 * `reservedQuantity` for `reserved` ready orders, `requestedQuantity` for
 * active (non-terminal) cook orders. Terminal statuses never contribute.
 */
export const summarizeOwnSlotHoldings = (
  orders: OwnHoldingOrder[],
  target: { dishId: string; slotKey: string },
): SlotHoldingsSummary => {
  return orders.reduce<SlotHoldingsSummary>(
    (summary, order) => {
      if (order.dishId !== target.dishId || order.slotKey !== target.slotKey) {
        return summary;
      }

      if (order.kind === 'ready' && order.status === 'reserved') {
        return { ...summary, reservedQuantity: summary.reservedQuantity + order.quantity };
      }

      if (order.kind === 'cook' && ACTIVE_COOK_STATUSES.includes(order.status)) {
        return { ...summary, requestedQuantity: summary.requestedQuantity + order.quantity };
      }

      return summary;
    },
    { reservedQuantity: 0, requestedQuantity: 0 },
  );
};
