import { describe, expect, it } from 'vitest';

import { dishConverter } from '../dishConverter';

const now = { toMillis: () => 0 } as never;

describe('dishConverter', () => {
  it('passes the document through unchanged on write', () => {
    const dish = {
      name: 'Mushroom risotto',
      description: '',
      mealTypes: ['lunch' as const],
      recipeItems: [],
      archivedAt: null,
      createdAt: now,
      createdBy: 'admin-1',
      updatedAt: now,
      updatedBy: 'admin-1',
    };

    expect(dishConverter.toFirestore(dish)).toBe(dish);
  });

  it('maps a Firestore document into a typed Dish, defaulting archivedAt and recipeItems', () => {
    const snapshot = {
      data: () => ({
        name: 'Mushroom risotto',
        description: 'Creamy risotto with mushrooms',
        mealTypes: ['lunch', 'dinner'],
        createdAt: now,
        createdBy: 'admin-1',
        updatedAt: now,
        updatedBy: 'admin-1',
      }),
    } as never;

    const dish = dishConverter.fromFirestore(snapshot, undefined);

    expect(dish).toEqual({
      name: 'Mushroom risotto',
      description: 'Creamy risotto with mushrooms',
      mealTypes: ['lunch', 'dinner'],
      recipeItems: [],
      archivedAt: null,
      createdAt: now,
      createdBy: 'admin-1',
      updatedAt: now,
      updatedBy: 'admin-1',
    });
  });

  it('preserves recipeItems and a non-null archivedAt when present', () => {
    const recipeItems = [
      { ingredientId: 'ingredient-1', ingredientName: 'Rice', requiredQuantity: 300, requiresPresence: null },
    ];
    const snapshot = {
      data: () => ({
        name: 'Mushroom risotto',
        description: '',
        mealTypes: ['lunch'],
        recipeItems,
        archivedAt: now,
        createdAt: now,
        createdBy: 'admin-1',
        updatedAt: now,
        updatedBy: 'admin-1',
      }),
    } as never;

    const dish = dishConverter.fromFirestore(snapshot, undefined);

    expect(dish.recipeItems).toEqual(recipeItems);
    expect(dish.archivedAt).toBe(now);
  });
});
