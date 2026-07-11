import { describe, expect, it } from 'vitest';
import { DishDomainError } from '../errors';
import type { Dish, RecipeItem } from '../types';
import { validateDish } from '../validateDish';

function makeRecipeItem(overrides: Partial<RecipeItem> = {}): RecipeItem {
  return {
    ingredientId: 'ingredient-1',
    ingredientName: 'Flour',
    requiredQuantity: 500,
    requiresPresence: null,
    ...overrides,
  };
}

function makeDish(overrides: Partial<Dish> = {}): Dish {
  return {
    name: 'Pancakes',
    description: '',
    mealTypes: ['breakfast'],
    recipeItems: [makeRecipeItem()],
    archivedAt: null,
    createdAt: { toMillis: () => 0 },
    createdBy: 'admin-1',
    updatedAt: { toMillis: () => 0 },
    updatedBy: 'admin-1',
    ...overrides,
  };
}

function expectCode(fn: () => void, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(DishDomainError);
    expect((error as DishDomainError).code).toBe(code);
    return;
  }
  throw new Error(`expected validateDish to throw ${code}`);
}

describe('validateDish', () => {
  it('accepts a dish with a complete quantity recipe item', () => {
    expect(() => {
      validateDish(makeDish());
    }).not.toThrow();
  });

  it('accepts a dish with a complete presence recipe item', () => {
    expect(() => {
      validateDish(
        makeDish({
          recipeItems: [makeRecipeItem({ requiredQuantity: null, requiresPresence: true })],
        }),
      );
    }).not.toThrow();
  });

  it('accepts an empty recipe (not configured, not an error)', () => {
    expect(() => {
      validateDish(makeDish({ recipeItems: [] }));
    }).not.toThrow();
  });

  it('accepts an optional empty description', () => {
    expect(() => {
      validateDish(makeDish({ description: '' }));
    }).not.toThrow();
  });

  it('rejects an empty name', () => {
    expectCode(() => {
      validateDish(makeDish({ name: '' }));
    }, 'dish/invalid-name');
  });

  it('rejects a whitespace-only name', () => {
    expectCode(() => {
      validateDish(makeDish({ name: '   ' }));
    }, 'dish/invalid-name');
  });

  it('rejects a recipe item missing an ingredient reference', () => {
    expectCode(() => {
      validateDish(makeDish({ recipeItems: [makeRecipeItem({ ingredientId: '' })] }));
    }, 'dish/incomplete-recipe-item');
  });

  it('rejects a recipe item with neither requiredQuantity nor requiresPresence', () => {
    expectCode(() => {
      validateDish(makeDish({ recipeItems: [makeRecipeItem({ requiredQuantity: null, requiresPresence: null })] }));
    }, 'dish/incomplete-recipe-item');
  });

  it('rejects a recipe item with requiredQuantity <= 0', () => {
    expectCode(() => {
      validateDish(makeDish({ recipeItems: [makeRecipeItem({ requiredQuantity: 0 })] }));
    }, 'dish/incomplete-recipe-item');
  });

  it('rejects a recipe item with requiresPresence explicitly false and no quantity', () => {
    expectCode(() => {
      validateDish(makeDish({ recipeItems: [makeRecipeItem({ requiredQuantity: null, requiresPresence: false })] }));
    }, 'dish/incomplete-recipe-item');
  });

  it('rejects an empty mealTypes array', () => {
    expectCode(() => {
      validateDish(makeDish({ mealTypes: [] }));
    }, 'dish/meal-type-required');
  });
});
