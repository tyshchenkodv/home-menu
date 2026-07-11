import type { DomainTimestamp, Order } from './types';

/**
 * Implements `docs/04-business-logic.md` "Cancellation": a `ready` order is
 * cancellable only while `reserved` and `now < scheduledFor`; a `cook` order
 * is cancellable only while `pending` or `approved` (forbidden from `cooking`
 * onward). Pure predicate — the caller decides how to surface a denial.
 */
export function canUserCancelOrder(order: Order, now: DomainTimestamp): boolean {
  if (order.kind === 'ready') {
    return order.status === 'reserved' && now.toMillis() < order.scheduledFor.toMillis();
  }

  return order.status === 'pending' || order.status === 'approved';
}
