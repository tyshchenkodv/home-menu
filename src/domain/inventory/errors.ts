/**
 * Stable, locale-independent error codes for the inventory domain layer.
 * Presentation code maps these to translation keys; domain code never returns
 * Ukrainian or English prose (see docs/04-business-logic.md, "Localization
 * boundary").
 */
export type InventoryErrorCode =
  | 'INVALID_NAME'
  | 'INVALID_TRACKING_MODE'
  | 'INVALID_BASE_UNIT'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRESENCE'
  | 'INVALID_LOW_STOCK_THRESHOLD'
  | 'INVALID_UNIT'
  | 'INVALID_AMOUNT'
  | 'INVALID_REASON'
  | 'INGREDIENT_ARCHIVED';

export class InventoryDomainError extends Error {
  readonly code: InventoryErrorCode;

  constructor(code: InventoryErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'InventoryDomainError';
    this.code = code;
  }
}
