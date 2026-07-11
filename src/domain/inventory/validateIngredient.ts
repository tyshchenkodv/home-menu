import { InventoryDomainError } from './errors';
import type { Ingredient } from './types';

const QUANTITY_BASE_UNITS = new Set(['gram', 'milliliter', 'piece']);

/**
 * Validates every invariant from SPEC "Ingredients" for a quantity or
 * presence ingredient. Throws an `InventoryDomainError` with a stable error
 * code on the first violation found; returns void on success.
 */
export function validateIngredient(ingredient: Ingredient): void {
  if (typeof ingredient.name !== 'string' || ingredient.name.trim().length === 0) {
    throw new InventoryDomainError('INVALID_NAME', 'Ingredient name must be a non-empty string');
  }

  const trackingMode: string = ingredient.trackingMode;

  if (trackingMode !== 'quantity' && trackingMode !== 'presence') {
    throw new InventoryDomainError('INVALID_TRACKING_MODE', `Unknown tracking mode: ${trackingMode}`);
  }

  if (ingredient.trackingMode === 'quantity') {
    validateQuantityIngredient(ingredient);
    return;
  }

  validatePresenceIngredient(ingredient);
}

function validateQuantityIngredient(ingredient: Ingredient): void {
  if (!QUANTITY_BASE_UNITS.has(ingredient.baseUnit)) {
    throw new InventoryDomainError(
      'INVALID_BASE_UNIT',
      `Quantity ingredients must use gram, milliliter, or piece, got: ${ingredient.baseUnit}`,
    );
  }

  if (
    ingredient.quantity === null ||
    typeof ingredient.quantity !== 'number' ||
    !Number.isFinite(ingredient.quantity) ||
    ingredient.quantity < 0
  ) {
    throw new InventoryDomainError('INVALID_QUANTITY', 'Quantity ingredients require a finite quantity >= 0');
  }

  if (ingredient.isPresent !== null) {
    throw new InventoryDomainError('INVALID_PRESENCE', 'Quantity ingredients must not set isPresent');
  }

  if (
    ingredient.lowStockThreshold !== null &&
    (typeof ingredient.lowStockThreshold !== 'number' ||
      !Number.isFinite(ingredient.lowStockThreshold) ||
      ingredient.lowStockThreshold < 0)
  ) {
    throw new InventoryDomainError(
      'INVALID_LOW_STOCK_THRESHOLD',
      'lowStockThreshold must be null or a finite number >= 0',
    );
  }
}

function validatePresenceIngredient(ingredient: Ingredient): void {
  if (ingredient.baseUnit !== 'presence') {
    throw new InventoryDomainError(
      'INVALID_BASE_UNIT',
      `Presence ingredients must use baseUnit "presence", got: ${ingredient.baseUnit}`,
    );
  }

  if (ingredient.quantity !== null) {
    throw new InventoryDomainError('INVALID_QUANTITY', 'Presence ingredients must not set quantity');
  }

  if (typeof ingredient.isPresent !== 'boolean') {
    throw new InventoryDomainError('INVALID_PRESENCE', 'Presence ingredients require isPresent to be true or false');
  }

  if (ingredient.lowStockThreshold !== null) {
    throw new InventoryDomainError(
      'INVALID_LOW_STOCK_THRESHOLD',
      'Presence ingredients must not set lowStockThreshold',
    );
  }
}
