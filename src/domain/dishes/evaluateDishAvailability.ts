import type { AvailabilityBatch, AvailabilityIngredient, Dish, DishAvailability, MissingIngredient } from './types';

/**
 * Implements `docs/03-data-model.md` "Derived availability".
 *
 * Resolution of an ambiguity left open by docs/03 and docs/04: an archived
 * dish is "unavailable for new orders" (rule 1). This implementation treats
 * an archived dish as fully unavailable — `configured: false`,
 * `readyQuantity: 0`, `canCook: false` — regardless of its recipe or any
 * existing prepared batches, rather than only suppressing `canCook`. Callers
 * (menu building) are expected to exclude archived dishes before evaluating,
 * per docs/04 "Building the menu" step 1; this function's archived handling
 * is a defensive fallback for direct callers.
 */
export function evaluateDishAvailability(
  dish: Dish,
  batches: AvailabilityBatch[],
  ingredients: AvailabilityIngredient[],
): DishAvailability {
  if (dish.archivedAt !== null) {
    return { configured: false, readyQuantity: 0, canCook: false, missingIngredients: [] };
  }

  const configured = dish.recipeItems.length > 0;
  const readyQuantity = sumAvailableQuantity(batches);

  if (!configured) {
    return { configured: false, readyQuantity, canCook: false, missingIngredients: [] };
  }

  const ingredientsById = new Map(ingredients.map(ingredient => [ingredient.ingredientId, ingredient]));
  const missingIngredients: MissingIngredient[] = [];

  dish.recipeItems.forEach(item => {
    const stock = ingredientsById.get(item.ingredientId) ?? null;

    if (item.requiresPresence === true) {
      const isPresent = stock?.isPresent === true;
      if (!isPresent) {
        missingIngredients.push({ ingredientId: item.ingredientId, shortage: null });
      }
      return;
    }

    const requiredQuantity = item.requiredQuantity ?? 0;
    const currentQuantity = stock?.quantity ?? 0;

    if (currentQuantity < requiredQuantity) {
      missingIngredients.push({ ingredientId: item.ingredientId, shortage: requiredQuantity - currentQuantity });
    }
  });

  return {
    configured: true,
    readyQuantity,
    canCook: missingIngredients.length === 0,
    missingIngredients,
  };
}

function sumAvailableQuantity(batches: AvailabilityBatch[]): number {
  return batches
    .filter(batch => batch.status !== 'discarded')
    .reduce((total, batch) => total + batch.availableQuantity, 0);
}
