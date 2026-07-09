import type { Ingredient } from './types';

/**
 * True when a quantity ingredient's current quantity is at or below its
 * low-stock threshold. Always false for presence ingredients or when no
 * threshold is set.
 */
export function isLowStock(ingredient: Ingredient): boolean {
  if (ingredient.trackingMode !== 'quantity') {
    return false;
  }

  if (ingredient.lowStockThreshold === null || ingredient.quantity === null) {
    return false;
  }

  return ingredient.quantity <= ingredient.lowStockThreshold;
}
