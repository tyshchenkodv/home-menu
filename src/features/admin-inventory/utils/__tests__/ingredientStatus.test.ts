import { describe, expect, it } from 'vitest';

import type { IngredientWithId } from '../../../../shared/types/ingredient';
import { getIngredientStatus } from '../ingredientStatus';

const baseIngredient: IngredientWithId = {
  id: 'ingredient-1',
  name: 'Flour',
  trackingMode: 'quantity',
  baseUnit: 'gram',
  quantity: 0,
  isPresent: null,
  lowStockThreshold: 100,
  archivedAt: null,
  createdAt: { toMillis: () => 0 } as never,
  createdBy: 'test-user',
  updatedAt: { toMillis: () => 0 } as never,
  updatedBy: 'test-user',
};

describe('getIngredientStatus', () => {
  it('returns in-stock success for a quantity ingredient above the low-stock threshold', () => {
    const ingredient: IngredientWithId = { ...baseIngredient, quantity: 500, lowStockThreshold: 100 };

    expect(getIngredientStatus(ingredient)).toEqual({
      labelKey: 'inventory.status.inStock',
      color: 'success',
    });
  });

  it('returns low-stock warning for a quantity ingredient at or below the threshold', () => {
    const ingredient: IngredientWithId = { ...baseIngredient, quantity: 50, lowStockThreshold: 100 };

    expect(getIngredientStatus(ingredient)).toEqual({
      labelKey: 'inventory.lowStock.label',
      color: 'warning',
    });
  });

  it('returns out-of-stock default for a quantity ingredient with zero quantity', () => {
    const ingredient: IngredientWithId = { ...baseIngredient, quantity: 0, lowStockThreshold: null };

    expect(getIngredientStatus(ingredient)).toEqual({
      labelKey: 'inventory.status.out',
      color: 'default',
    });
  });

  it('returns out-of-stock default for a quantity ingredient with null quantity', () => {
    const ingredient: IngredientWithId = { ...baseIngredient, quantity: null, lowStockThreshold: null };

    expect(getIngredientStatus(ingredient)).toEqual({
      labelKey: 'inventory.status.out',
      color: 'default',
    });
  });

  it('returns in-stock success for a present presence ingredient', () => {
    const ingredient: IngredientWithId = {
      ...baseIngredient,
      trackingMode: 'presence',
      baseUnit: 'presence',
      quantity: null,
      isPresent: true,
      lowStockThreshold: null,
    };

    expect(getIngredientStatus(ingredient)).toEqual({
      labelKey: 'inventory.status.inStock',
      color: 'success',
    });
  });

  it('returns out-of-stock default for an absent presence ingredient', () => {
    const ingredient: IngredientWithId = {
      ...baseIngredient,
      trackingMode: 'presence',
      baseUnit: 'presence',
      quantity: null,
      isPresent: false,
      lowStockThreshold: null,
    };

    expect(getIngredientStatus(ingredient)).toEqual({
      labelKey: 'inventory.status.out',
      color: 'default',
    });
  });
});
