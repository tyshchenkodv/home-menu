import { DishDomainError } from './errors';
import type { Dish, RecipeItem } from './types';

/**
 * Validates SPEC "Domain and data model" rule 1: a dish may be saved with an
 * empty recipe (it derives "not configured"; that is not an error), but every
 * present recipe item must reference an ingredient and specify either a
 * positive required quantity or `requiresPresence === true`. `mealTypes` must
 * contain at least one value. `description` is optional. Throws a
 * `DishDomainError` with a stable error code on the first violation found.
 */
export function validateDish(dish: Dish): void {
  if (typeof dish.name !== 'string' || dish.name.trim().length === 0) {
    throw new DishDomainError('dish/invalid-name', 'Dish name must be a non-empty string');
  }

  if (!Array.isArray(dish.mealTypes) || dish.mealTypes.length === 0) {
    throw new DishDomainError('dish/meal-type-required', 'Dish requires at least one meal type');
  }

  dish.recipeItems.forEach(item => {
    validateRecipeItem(item);
  });
}

function validateRecipeItem(item: RecipeItem): void {
  if (typeof item.ingredientId !== 'string' || item.ingredientId.trim().length === 0) {
    throw new DishDomainError('dish/incomplete-recipe-item', 'Recipe item requires an ingredientId');
  }

  const hasPositiveQuantity =
    typeof item.requiredQuantity === 'number' && Number.isFinite(item.requiredQuantity) && item.requiredQuantity > 0;
  const requiresPresence = item.requiresPresence === true;

  if (!hasPositiveQuantity && !requiresPresence) {
    throw new DishDomainError(
      'dish/incomplete-recipe-item',
      'Recipe item requires requiredQuantity > 0 or requiresPresence === true',
    );
  }
}
