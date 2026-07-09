import { describe, expect, it } from 'vitest';
import { InventoryDomainError } from '../errors';
import type { Ingredient } from '../types';
import { correctQuantity, markAbsent, markPresent, restockQuantity } from '../movementCommands';

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
    isPresent: false,
    lowStockThreshold: null,
    archivedAt: null,
    createdAt: { toMillis: () => 0 },
    createdBy: 'user-1',
    updatedAt: { toMillis: () => 0 },
    updatedBy: 'user-1',
    ...overrides,
  };
}

function expectCode(fn: () => void, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InventoryDomainError);
    expect((error as InventoryDomainError).code).toBe(code);
    return;
  }
  throw new Error(`expected command to throw ${code}`);
}

describe('restockQuantity', () => {
  it('computes a positive delta and balanceAfter', () => {
    const result = restockQuantity(makeQuantityIngredient({ quantity: 500 }), 250);

    expect(result.movement).toMatchObject({
      type: 'restock',
      ingredientName: 'Flour',
      deltaQuantity: 250,
      balanceAfter: 750,
      presenceBefore: null,
      presenceAfter: null,
      cookingRequestId: null,
      preparedBatchId: null,
      note: null,
    });
    expect(result.ingredientPatch).toEqual({ quantity: 750 });
  });

  it('rejects a zero delta', () => {
    expectCode(() => restockQuantity(makeQuantityIngredient(), 0), 'INVALID_QUANTITY');
  });

  it('rejects a negative delta', () => {
    expectCode(() => restockQuantity(makeQuantityIngredient(), -10), 'INVALID_QUANTITY');
  });

  it('rejects NaN and Infinity deltas', () => {
    expectCode(() => restockQuantity(makeQuantityIngredient(), Number.NaN), 'INVALID_QUANTITY');
    expectCode(() => restockQuantity(makeQuantityIngredient(), Number.POSITIVE_INFINITY), 'INVALID_QUANTITY');
  });

  it('rejects a presence ingredient', () => {
    expectCode(() => restockQuantity(makePresenceIngredient(), 1), 'INVALID_TRACKING_MODE');
  });

  it('rejects mutation of an archived ingredient', () => {
    expectCode(
      () => restockQuantity(makeQuantityIngredient({ archivedAt: { toMillis: () => 1 } }), 1),
      'INGREDIENT_ARCHIVED',
    );
  });
});

describe('correctQuantity', () => {
  it('computes deltaQuantity from the current balance and requires a reason', () => {
    const result = correctQuantity(makeQuantityIngredient({ quantity: 500 }), 420, 'Recount');

    expect(result.movement).toMatchObject({
      type: 'correction',
      ingredientName: 'Flour',
      deltaQuantity: -80,
      balanceAfter: 420,
      note: 'Recount',
      presenceBefore: null,
      presenceAfter: null,
    });
    expect(result.ingredientPatch).toEqual({ quantity: 420 });
  });

  it('rejects a missing reason', () => {
    expectCode(() => correctQuantity(makeQuantityIngredient(), 100, ''), 'INVALID_REASON');
  });

  it('rejects a whitespace-only reason', () => {
    expectCode(() => correctQuantity(makeQuantityIngredient(), 100, '   '), 'INVALID_REASON');
  });

  it('rejects a negative exact balance', () => {
    expectCode(() => correctQuantity(makeQuantityIngredient(), -1, 'Recount'), 'INVALID_QUANTITY');
  });

  it('rejects a presence ingredient', () => {
    expectCode(() => correctQuantity(makePresenceIngredient(), 1, 'Recount'), 'INVALID_TRACKING_MODE');
  });

  it('rejects mutation of an archived ingredient', () => {
    expectCode(
      () => correctQuantity(makeQuantityIngredient({ archivedAt: { toMillis: () => 1 } }), 100, 'Recount'),
      'INGREDIENT_ARCHIVED',
    );
  });
});

describe('markPresent', () => {
  it('transitions presence from false to true as a restock movement', () => {
    const result = markPresent(makePresenceIngredient({ isPresent: false }));

    expect(result.movement).toMatchObject({
      type: 'restock',
      ingredientName: 'Ketchup',
      deltaQuantity: null,
      balanceAfter: null,
      presenceBefore: false,
      presenceAfter: true,
      note: null,
    });
    expect(result.ingredientPatch).toEqual({ isPresent: true });
  });

  it('rejects a quantity ingredient', () => {
    expectCode(() => markPresent(makeQuantityIngredient()), 'INVALID_TRACKING_MODE');
  });

  it('rejects mutation of an archived ingredient', () => {
    expectCode(() => markPresent(makePresenceIngredient({ archivedAt: { toMillis: () => 1 } })), 'INGREDIENT_ARCHIVED');
  });
});

describe('markAbsent', () => {
  it('transitions presence from true to false as a correction movement', () => {
    const result = markAbsent(makePresenceIngredient({ isPresent: true }));

    expect(result.movement).toMatchObject({
      type: 'correction',
      ingredientName: 'Ketchup',
      deltaQuantity: null,
      balanceAfter: null,
      presenceBefore: true,
      presenceAfter: false,
      note: null,
    });
    expect(result.ingredientPatch).toEqual({ isPresent: false });
  });

  it('rejects a quantity ingredient', () => {
    expectCode(() => markAbsent(makeQuantityIngredient()), 'INVALID_TRACKING_MODE');
  });

  it('rejects mutation of an archived ingredient', () => {
    expectCode(() => markAbsent(makePresenceIngredient({ archivedAt: { toMillis: () => 1 } })), 'INGREDIENT_ARCHIVED');
  });
});
