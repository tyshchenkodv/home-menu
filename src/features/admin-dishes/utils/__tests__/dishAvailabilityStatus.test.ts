import { describe, expect, it } from 'vitest';

import type { IngredientWithId } from '../../../../shared/types/ingredient';
import type { DishWithId } from '../../../../shared/types/dish';
import { getDishAvailabilityStatus } from '../dishAvailabilityStatus';

const now = { toMillis: () => 0 } as never;

const baseDish: DishWithId = {
  id: 'dish-1',
  name: 'Pancakes',
  description: '',
  mealTypes: ['breakfast'],
  recipeItems: [
    { ingredientId: 'ingredient-1', ingredientName: 'Flour', requiredQuantity: 300, requiresPresence: null },
  ],
  archivedAt: null,
  createdAt: now,
  createdBy: 'admin-1',
  updatedAt: now,
  updatedBy: 'admin-1',
};

const flour: IngredientWithId = {
  id: 'ingredient-1',
  name: 'Flour',
  trackingMode: 'quantity',
  baseUnit: 'gram',
  quantity: 500,
  isPresent: null,
  lowStockThreshold: null,
  archivedAt: null,
  createdAt: now,
  createdBy: 'admin-1',
  updatedAt: now,
  updatedBy: 'admin-1',
};

describe('getDishAvailabilityStatus', () => {
  it('returns not-configured/secondary for a dish with an empty recipe', () => {
    const dish: DishWithId = { ...baseDish, recipeItems: [] };

    const status = getDishAvailabilityStatus(dish, [flour]);

    expect(status.labelKey).toBe('status.dishAvailability.notConfigured');
    expect(status.color).toBe('secondary');
  });

  it('returns can-be-cooked/warning when every recipe item is satisfied', () => {
    const status = getDishAvailabilityStatus(baseDish, [flour]);

    expect(status.labelKey).toBe('status.dishAvailability.canBeCooked');
    expect(status.color).toBe('warning');
    expect(status.availability.canCook).toBe(true);
  });

  it('returns unavailable/default when a recipe item is short', () => {
    const shortFlour: IngredientWithId = { ...flour, quantity: 100 };

    const status = getDishAvailabilityStatus(baseDish, [shortFlour]);

    expect(status.labelKey).toBe('status.dishAvailability.unavailable');
    expect(status.color).toBe('default');
    expect(status.availability.missingIngredients).toEqual([{ ingredientId: 'ingredient-1', shortage: 200 }]);
  });

  it('reflects the real recipe/stock state for an archived dish (management list, not the menu)', () => {
    // On the dishes-management Archived tab the chip must reflect the dish's
    // actual recipe, not the archived-for-ordering state — otherwise a fully
    // configured dish would mislabel as "not configured".
    const archivedDish: DishWithId = { ...baseDish, archivedAt: now };

    const status = getDishAvailabilityStatus(archivedDish, [flour]);

    expect(status.labelKey).toBe('status.dishAvailability.canBeCooked');
    expect(status.color).toBe('warning');
  });
});
