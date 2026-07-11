import { describe, expect, it } from 'vitest';
import type { AvailabilityBatch, AvailabilityIngredient, Dish, RecipeItem } from '../types';
import { evaluateDishAvailability } from '../evaluateDishAvailability';

function makeQuantityItem(overrides: Partial<RecipeItem> = {}): RecipeItem {
  return {
    ingredientId: 'flour',
    ingredientName: 'Flour',
    requiredQuantity: 500,
    requiresPresence: null,
    ...overrides,
  };
}

function makePresenceItem(overrides: Partial<RecipeItem> = {}): RecipeItem {
  return {
    ingredientId: 'ketchup',
    ingredientName: 'Ketchup',
    requiredQuantity: null,
    requiresPresence: true,
    ...overrides,
  };
}

function makeDish(overrides: Partial<Dish> = {}): Dish {
  return {
    name: 'Pancakes',
    description: '',
    mealTypes: ['breakfast'],
    recipeItems: [makeQuantityItem()],
    archivedAt: null,
    createdAt: { toMillis: () => 0 },
    createdBy: 'admin-1',
    updatedAt: { toMillis: () => 0 },
    updatedBy: 'admin-1',
    ...overrides,
  };
}

describe('evaluateDishAvailability', () => {
  it('marks an empty recipe as not configured, with canCook false', () => {
    const result = evaluateDishAvailability(makeDish({ recipeItems: [] }), [], []);

    expect(result).toEqual({
      configured: false,
      readyQuantity: 0,
      canCook: false,
      missingIngredients: [],
    });
  });

  it('reports "ready now" when prepared portions are available', () => {
    const batches: AvailabilityBatch[] = [{ status: 'available', availableQuantity: 3 }];
    const ingredients: AvailabilityIngredient[] = [{ ingredientId: 'flour', quantity: 0, isPresent: null }];

    const result = evaluateDishAvailability(makeDish(), batches, ingredients);

    expect(result.configured).toBe(true);
    expect(result.readyQuantity).toBe(3);
  });

  it('sums availableQuantity across non-discarded batches only', () => {
    const batches: AvailabilityBatch[] = [
      { status: 'available', availableQuantity: 2 },
      { status: 'depleted', availableQuantity: 0 },
      { status: 'discarded', availableQuantity: 5 },
    ];
    const ingredients: AvailabilityIngredient[] = [{ ingredientId: 'flour', quantity: 1000, isPresent: null }];

    const result = evaluateDishAvailability(makeDish(), batches, ingredients);

    expect(result.readyQuantity).toBe(2);
  });

  it('reports canCook true when a quantity recipe item is satisfied', () => {
    const ingredients: AvailabilityIngredient[] = [{ ingredientId: 'flour', quantity: 500, isPresent: null }];

    const result = evaluateDishAvailability(makeDish(), [], ingredients);

    expect(result.canCook).toBe(true);
    expect(result.missingIngredients).toEqual([]);
  });

  it('reports "can be cooked" (no ready portions, canCook true)', () => {
    const ingredients: AvailabilityIngredient[] = [{ ingredientId: 'flour', quantity: 500, isPresent: null }];

    const result = evaluateDishAvailability(makeDish(), [], ingredients);

    expect(result.readyQuantity).toBe(0);
    expect(result.canCook).toBe(true);
  });

  it('reports unavailable (no ready portions, canCook false) with shortage for a quantity item', () => {
    const ingredients: AvailabilityIngredient[] = [{ ingredientId: 'flour', quantity: 200, isPresent: null }];

    const result = evaluateDishAvailability(makeDish(), [], ingredients);

    expect(result.readyQuantity).toBe(0);
    expect(result.canCook).toBe(false);
    expect(result.missingIngredients).toEqual([{ ingredientId: 'flour', shortage: 300 }]);
  });

  it('reports a missing ingredient (not found in stock) as unsatisfied', () => {
    const result = evaluateDishAvailability(makeDish(), [], []);

    expect(result.canCook).toBe(false);
    expect(result.missingIngredients).toEqual([{ ingredientId: 'flour', shortage: 500 }]);
  });

  it('requires isPresent === true for a presence recipe item', () => {
    const dish = makeDish({ recipeItems: [makePresenceItem()] });
    const notPresent: AvailabilityIngredient[] = [{ ingredientId: 'ketchup', quantity: null, isPresent: false }];
    const present: AvailabilityIngredient[] = [{ ingredientId: 'ketchup', quantity: null, isPresent: true }];

    expect(evaluateDishAvailability(dish, [], notPresent).canCook).toBe(false);
    expect(evaluateDishAvailability(dish, [], notPresent).missingIngredients).toEqual([
      { ingredientId: 'ketchup', shortage: null },
    ]);
    expect(evaluateDishAvailability(dish, [], present).canCook).toBe(true);
    expect(evaluateDishAvailability(dish, [], present).missingIngredients).toEqual([]);
  });

  it('requires every recipe item satisfied for canCook, mixing presence and quantity items', () => {
    const dish = makeDish({ recipeItems: [makeQuantityItem(), makePresenceItem()] });
    const ingredients: AvailabilityIngredient[] = [
      { ingredientId: 'flour', quantity: 500, isPresent: null },
      { ingredientId: 'ketchup', quantity: null, isPresent: false },
    ];

    const result = evaluateDishAvailability(dish, [], ingredients);

    expect(result.canCook).toBe(false);
    expect(result.missingIngredients).toEqual([{ ingredientId: 'ketchup', shortage: null }]);
  });

  it('treats an archived dish as fully unavailable regardless of recipe or stock', () => {
    const dish = makeDish({ archivedAt: { toMillis: () => 1 } });
    const batches: AvailabilityBatch[] = [{ status: 'available', availableQuantity: 5 }];
    const ingredients: AvailabilityIngredient[] = [{ ingredientId: 'flour', quantity: 500, isPresent: null }];

    const result = evaluateDishAvailability(dish, batches, ingredients);

    expect(result).toEqual({
      configured: false,
      readyQuantity: 0,
      canCook: false,
      missingIngredients: [],
    });
  });
});
