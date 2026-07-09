import { describe, expect, it } from 'vitest';
import { InventoryDomainError } from '../errors';
import type { Ingredient } from '../types';
import { validateIngredient } from '../validateIngredient';

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

function expectCode(fn: () => void, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InventoryDomainError);
    expect((error as InventoryDomainError).code).toBe(code);
    return;
  }
  throw new Error(`expected validateIngredient to throw ${code}`);
}

describe('validateIngredient', () => {
  it('accepts a valid quantity ingredient', () => {
    expect(() => {
      validateIngredient(makeQuantityIngredient());
    }).not.toThrow();
  });

  it('accepts a valid quantity ingredient with a null low-stock threshold', () => {
    expect(() => {
      validateIngredient(makeQuantityIngredient({ lowStockThreshold: null }));
    }).not.toThrow();
  });

  it('accepts a valid presence ingredient (present)', () => {
    expect(() => {
      validateIngredient(makePresenceIngredient({ isPresent: true }));
    }).not.toThrow();
  });

  it('accepts a valid presence ingredient (absent)', () => {
    expect(() => {
      validateIngredient(makePresenceIngredient({ isPresent: false }));
    }).not.toThrow();
  });

  it('rejects an empty name', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ name: '' }));
    }, 'INVALID_NAME');
  });

  it('rejects a whitespace-only name', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ name: '   ' }));
    }, 'INVALID_NAME');
  });

  it('rejects an unknown tracking mode', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ trackingMode: 'bogus' as Ingredient['trackingMode'] }));
    }, 'INVALID_TRACKING_MODE');
  });

  it('rejects a presence base unit on a quantity ingredient', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ baseUnit: 'presence' }));
    }, 'INVALID_BASE_UNIT');
  });

  it('rejects a non-presence base unit on a presence ingredient', () => {
    expectCode(() => {
      validateIngredient(makePresenceIngredient({ baseUnit: 'gram' }));
    }, 'INVALID_BASE_UNIT');
  });

  it('rejects a negative quantity', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ quantity: -1 }));
    }, 'INVALID_QUANTITY');
  });

  it('rejects a null quantity on a quantity ingredient', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ quantity: null }));
    }, 'INVALID_QUANTITY');
  });

  it('rejects a non-null isPresent on a quantity ingredient', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ isPresent: true }));
    }, 'INVALID_PRESENCE');
  });

  it('rejects a non-null quantity on a presence ingredient', () => {
    expectCode(() => {
      validateIngredient(makePresenceIngredient({ quantity: 1 }));
    }, 'INVALID_QUANTITY');
  });

  it('rejects a non-boolean isPresent on a presence ingredient', () => {
    expectCode(() => {
      validateIngredient(makePresenceIngredient({ isPresent: null as unknown as boolean }));
    }, 'INVALID_PRESENCE');
  });

  it('rejects a non-null low-stock threshold on a presence ingredient', () => {
    expectCode(() => {
      validateIngredient(makePresenceIngredient({ lowStockThreshold: 1 }));
    }, 'INVALID_LOW_STOCK_THRESHOLD');
  });

  it('rejects a negative low-stock threshold on a quantity ingredient', () => {
    expectCode(() => {
      validateIngredient(makeQuantityIngredient({ lowStockThreshold: -5 }));
    }, 'INVALID_LOW_STOCK_THRESHOLD');
  });
});
