import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { IngredientDisplay } from '../types/ingredientDisplay';

const KILO_THRESHOLD = 1000;

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Converts a persisted ingredient into a presentation-ready display value:
 * grams/milliliters roll up to kilograms/liters with one decimal once the
 * canonical quantity reaches 1000, pieces are shown as-is, and presence
 * ingredients report their boolean state instead of a quantity.
 */
export function formatIngredientQuantity(ingredient: IngredientWithId): IngredientDisplay {
  if (ingredient.trackingMode === 'presence') {
    return { kind: 'presence', isPresent: ingredient.isPresent ?? false };
  }

  const quantity = ingredient.quantity ?? 0;

  if (ingredient.baseUnit === 'gram') {
    return quantity >= KILO_THRESHOLD
      ? { kind: 'quantity', amount: round1(quantity / KILO_THRESHOLD), unit: 'kilogram' }
      : { kind: 'quantity', amount: quantity, unit: 'gram' };
  }

  if (ingredient.baseUnit === 'milliliter') {
    return quantity >= KILO_THRESHOLD
      ? { kind: 'quantity', amount: round1(quantity / KILO_THRESHOLD), unit: 'liter' }
      : { kind: 'quantity', amount: quantity, unit: 'milliliter' };
  }

  return { kind: 'quantity', amount: quantity, unit: 'piece' };
}
