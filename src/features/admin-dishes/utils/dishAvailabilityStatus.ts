import { evaluateDishAvailability } from '../../../domain/dishes/evaluateDishAvailability';
import type { AvailabilityBatch, DishAvailability } from '../../../domain/dishes/types';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { DishWithId } from '../../../shared/types/dish';

/** Semantic status label key and chip color for a dish's derived availability. */
export interface DishAvailabilityStatus {
  labelKey: string;
  color: 'success' | 'warning' | 'default' | 'secondary';
  availability: DishAvailability;
}

/**
 * No prepared-batch infrastructure exists yet (it belongs to a later
 * vertical slice), so this dishes slice always evaluates availability
 * against zero prepared batches. That means the "ready now" state can never
 * be reached here; `canCook`/`configured` still reflect real ingredient
 * stock. `readyQuantity` will start participating once batches are wired up.
 */
const NO_BATCHES: AvailabilityBatch[] = [];

/**
 * Maps a dish's derived availability to the 4-state chip matrix from
 * `docs/design/screens/shared-patterns.md`: ready now (success), can be
 * cooked (warning), unavailable (default/grey), not configured (secondary).
 */
export function getDishAvailabilityStatus(dish: DishWithId, ingredients: IngredientWithId[]): DishAvailabilityStatus {
  // The dishes-management list shows the recipe/stock state of a dish
  // regardless of whether it is archived. `evaluateDishAvailability` zeroes an
  // archived dish (it is correctly unavailable for *new orders*), which on the
  // Archived tab would mislabel a fully-configured dish as "not configured".
  // Evaluate against a non-archived view so the chip reflects the real recipe.
  const availability = evaluateDishAvailability(
    { ...dish, archivedAt: null },
    NO_BATCHES,
    ingredients.map(ingredient => ({
      ingredientId: ingredient.id,
      quantity: ingredient.quantity,
      isPresent: ingredient.isPresent,
    })),
  );

  if (!availability.configured) {
    return { labelKey: 'status.dishAvailability.notConfigured', color: 'secondary', availability };
  }

  if (availability.readyQuantity > 0) {
    return { labelKey: 'status.dishAvailability.readyNow', color: 'success', availability };
  }

  if (availability.canCook) {
    return { labelKey: 'status.dishAvailability.canBeCooked', color: 'warning', availability };
  }

  return { labelKey: 'status.dishAvailability.unavailable', color: 'default', availability };
}
