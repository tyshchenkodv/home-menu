import { describe, expect, it } from 'vitest';

import type { InventoryMovementWithId } from '../../../../shared/types/inventoryMovement';
import { groupMovementsByDay } from '../groupMovementsByDay';

const buildMovement = (id: string, millis: number): InventoryMovementWithId => ({
  id,
  ingredientId: 'ingredient-1',
  ingredientName: 'Ingredient',
  type: 'restock',
  deltaQuantity: 100,
  presenceBefore: null,
  presenceAfter: null,
  balanceAfter: 100,
  cookingRequestId: null,
  preparedBatchId: null,
  note: null,
  createdAt: { toMillis: () => millis } as never,
  createdBy: 'admin-uid',
});

describe('groupMovementsByDay', () => {
  it('groups movements that fall on the same calendar day, preserving order', () => {
    const now = Date.UTC(2026, 6, 10, 12, 0);
    const movements = [
      buildMovement('a', Date.UTC(2026, 6, 10, 9, 0)),
      buildMovement('b', Date.UTC(2026, 6, 10, 15, 0)),
      buildMovement('c', Date.UTC(2026, 6, 9, 8, 0)),
      buildMovement('d', Date.UTC(2026, 6, 1, 8, 0)),
    ];

    const groups = groupMovementsByDay(movements, now);

    expect(groups).toHaveLength(3);
    expect(groups[0].movements.map(m => m.id)).toEqual(['a', 'b']);
    expect(groups[1].movements.map(m => m.id)).toEqual(['c']);
    expect(groups[2].movements.map(m => m.id)).toEqual(['d']);
  });

  it('marks the group for the reference day as today and the previous day as yesterday', () => {
    const now = Date.UTC(2026, 6, 10, 12, 0);
    const movements = [
      buildMovement('a', Date.UTC(2026, 6, 10, 9, 0)),
      buildMovement('b', Date.UTC(2026, 6, 9, 8, 0)),
      buildMovement('c', Date.UTC(2026, 6, 1, 8, 0)),
    ];

    const groups = groupMovementsByDay(movements, now);

    expect(groups[0].kind).toBe('today');
    expect(groups[1].kind).toBe('yesterday');
    expect(groups[2].kind).toBe('other');
    expect(groups[2].date).toBeInstanceOf(Date);
  });

  it('returns an empty array for no movements', () => {
    expect(groupMovementsByDay([], Date.now())).toEqual([]);
  });
});
