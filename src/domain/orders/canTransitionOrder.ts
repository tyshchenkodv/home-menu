import type { OrderStatus, OrderTransitionAction } from './types';

const TERMINAL_STATUSES = new Set<OrderStatus>(['rejected', 'cancelled', 'consumed']);

/**
 * The standard (non-correction) transition matrix, keyed by action, per
 * `docs/04-business-logic.md` "Cooking request lifecycle", "Reserving
 * prepared food", "Cancellation", and "Automatic consumption".
 */
const STANDARD_TRANSITIONS: Record<
  Exclude<OrderTransitionAction, 'adminCorrection'>,
  Partial<Record<OrderStatus, OrderStatus>>
> = {
  approve: { pending: 'approved' },
  reject: { pending: 'rejected' },
  startCooking: { approved: 'cooking' },
  completeCooking: { cooking: 'prepared' },
  userCancel: { pending: 'cancelled', approved: 'cancelled', reserved: 'cancelled' },
  normalize: { reserved: 'consumed', prepared: 'consumed' },
};

/**
 * Implements the full order status transition matrix per
 * `docs/04-business-logic.md`, including SPEC "Domain and data model" rule 4:
 * an admin correction may cancel an order from any non-terminal status.
 * Terminal statuses (`rejected`, `cancelled`, `consumed`) never transition
 * further, even via correction.
 */
export function canTransitionOrder(from: OrderStatus, to: OrderStatus, action: OrderTransitionAction): boolean {
  if (action === 'adminCorrection') {
    return to === 'cancelled' && !TERMINAL_STATUSES.has(from);
  }

  return STANDARD_TRANSITIONS[action][from] === to;
}
