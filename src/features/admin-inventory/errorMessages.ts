import { InventoryDomainError, type InventoryErrorCode } from '../../domain/inventory/errors';

const CODE_TO_TRANSLATION_KEY: Record<InventoryErrorCode, string> = {
  INVALID_NAME: 'inventory.errors.invalidName',
  INVALID_TRACKING_MODE: 'inventory.errors.invalidTrackingMode',
  INVALID_BASE_UNIT: 'inventory.errors.invalidBaseUnit',
  INVALID_QUANTITY: 'inventory.errors.invalidQuantity',
  INVALID_PRESENCE: 'inventory.errors.invalidPresence',
  INVALID_LOW_STOCK_THRESHOLD: 'inventory.errors.invalidLowStockThreshold',
  INVALID_UNIT: 'inventory.errors.invalidUnit',
  INVALID_AMOUNT: 'inventory.errors.invalidAmount',
  INVALID_REASON: 'inventory.errors.invalidReason',
  INGREDIENT_ARCHIVED: 'inventory.errors.ingredientArchived',
};

/**
 * Maps a thrown error to a translation key for display. `InventoryDomainError`
 * codes map to their dedicated message; anything else (network failures,
 * infrastructure errors) falls back to the generic error message so the
 * domain layer never has to know about i18n.
 */
export function resolveErrorTranslationKey(error: unknown): string {
  if (error instanceof InventoryDomainError) {
    return CODE_TO_TRANSLATION_KEY[error.code];
  }

  return 'common.error';
}
