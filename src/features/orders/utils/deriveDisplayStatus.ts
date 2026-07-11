import { computeConsumedNormalization } from '../../../domain/orders/normalization';
import type { DomainTimestamp, Order, OrderStatus } from '../../../domain/orders/types';

/** Statuses that keep an order in the "Active" tab (docs/design/screens/my-orders.md). */
export const NON_TERMINAL_STATUSES: OrderStatus[] = ['pending', 'approved', 'cooking', 'prepared', 'reserved'];

/** Terminal statuses that live in the "History" tab. */
export const TERMINAL_STATUSES: OrderStatus[] = ['consumed', 'rejected', 'cancelled'];

/**
 * Client-derived display status (SPEC "Domain and data model" rule 6 /
 * `docs/04-business-logic.md` "Automatic consumption"): reuses the same
 * pure predicate the normalization transaction (Task 6) will use, purely to
 * decide what the user sees — this module never mutates persisted data.
 */
export function deriveDisplayStatus(order: Order, now: DomainTimestamp): OrderStatus {
  return computeConsumedNormalization(order, now).shouldNormalize ? 'consumed' : order.status;
}
