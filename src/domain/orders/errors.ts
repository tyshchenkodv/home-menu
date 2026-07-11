/**
 * Stable, locale-independent error codes for the orders domain layer.
 * Presentation code maps these to translation keys; domain code never returns
 * Ukrainian or English prose (see docs/04-business-logic.md, "Localization
 * boundary").
 */
export type OrderErrorCode =
  | 'order/invalid-transition'
  | 'order/cancel-not-allowed'
  | 'order/correction-reason-required'
  | 'order/invalid-quantity'
  | 'order/invalid-meal-time'
  | 'order/date-out-of-window';

export class OrderDomainError extends Error {
  readonly code: OrderErrorCode;

  constructor(code: OrderErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'OrderDomainError';
    this.code = code;
  }
}
