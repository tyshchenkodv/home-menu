import { describe, expect, it } from 'vitest';
import type { Ingredient } from '../types';
import { isLowStock } from '../isLowStock';

function makeQuantityIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    name: 'Flour',
    trackingMode: 'quantity',
    baseUnit: 'gram',
    quantity: 500,
    isPresent: null,
    lowStockThreshold: 100,
    archivedAt: null,
    createdAt: { toMillis: () => 0 },
    createdBy: 'user-1',
    updatedAt: { toMillis: () => 0 },
    updatedBy: 'user-1',
    ...overrides,
  };
}

function makePresenceIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    name: 'Ketchup',
    trackingMode: 'presence',
    baseUnit: 'presence',
    quantity: null,
    isPresent: true,
    lowStockThreshold: null,
    archivedAt: null,
    createdAt: { toMillis: () => 0 },
    createdBy: 'user-1',
    updatedAt: { toMillis: () => 0 },
    updatedBy: 'user-1',
    ...overrides,
  };
}

describe('isLowStock', () => {
  it('is true when quantity equals the threshold', () => {
    expect(isLowStock(makeQuantityIngredient({ quantity: 100, lowStockThreshold: 100 }))).toBe(true);
  });

  it('is true when quantity is below the threshold', () => {
    expect(isLowStock(makeQuantityIngredient({ quantity: 50, lowStockThreshold: 100 }))).toBe(true);
  });

  it('is false when quantity is above the threshold', () => {
    expect(isLowStock(makeQuantityIngredient({ quantity: 150, lowStockThreshold: 100 }))).toBe(false);
  });

  it('is false when the threshold is null', () => {
    expect(isLowStock(makeQuantityIngredient({ quantity: 0, lowStockThreshold: null }))).toBe(false);
  });

  it('is false for presence ingredients', () => {
    expect(isLowStock(makePresenceIngredient())).toBe(false);
  });
});
