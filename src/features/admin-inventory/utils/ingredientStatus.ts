import { isLowStock } from '../../../domain/inventory/isLowStock';
import type { IngredientWithId } from '../../../shared/types/ingredient';

/** Semantic status label key and chip color for an ingredient's current stock. */
export interface IngredientStatus {
  labelKey: string;
  color: 'success' | 'warning' | 'default';
}

/**
 * Maps an ingredient's tracking mode and current stock to the semantic
 * status shown in the UI: in-stock (success), low-stock (warning), or
 * out-of-stock (default).
 */
export function getIngredientStatus(ingredient: IngredientWithId): IngredientStatus {
  if (ingredient.trackingMode === 'presence') {
    return ingredient.isPresent
      ? { labelKey: 'inventory.status.inStock', color: 'success' }
      : { labelKey: 'inventory.status.out', color: 'default' };
  }

  if (isLowStock(ingredient)) {
    return { labelKey: 'inventory.lowStock.label', color: 'warning' };
  }

  if (ingredient.quantity !== null && ingredient.quantity > 0) {
    return { labelKey: 'inventory.status.inStock', color: 'success' };
  }

  return { labelKey: 'inventory.status.out', color: 'default' };
}
