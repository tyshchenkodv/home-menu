import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { OrderWithId } from '../../../../types/order';
import type { IngredientWithId } from '../../../../types/ingredient';
import { useNavBadgeCounts } from '../useNavBadgeCounts';

const { subscribeAdminBoardOrdersMock, subscribeAllIngredientsMock } = vi.hoisted(() => ({
  subscribeAdminBoardOrdersMock: vi.fn(),
  subscribeAllIngredientsMock: vi.fn(),
}));

vi.mock('../../../../../infrastructure/firebase/services/orderService', () => ({
  subscribeAdminBoardOrders: subscribeAdminBoardOrdersMock,
}));

vi.mock('../../../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeAllIngredients: subscribeAllIngredientsMock,
}));

const buildOrder = (status: OrderWithId['status']): OrderWithId => ({ status }) as OrderWithId;

const buildIngredient = (overrides: Partial<IngredientWithId>): IngredientWithId =>
  ({
    trackingMode: 'quantity',
    quantity: 10,
    lowStockThreshold: 5,
    ...overrides,
  }) as IngredientWithId;

afterEach(() => {
  vi.clearAllMocks();
});

describe('useNavBadgeCounts', () => {
  it('does not subscribe when disabled', () => {
    renderHook(() => useNavBadgeCounts(false));

    expect(subscribeAdminBoardOrdersMock).not.toHaveBeenCalled();
    expect(subscribeAllIngredientsMock).not.toHaveBeenCalled();
  });

  it('reports the pending-requests and low-stock counts from the subscriptions', () => {
    let ordersCallback: ((orders: OrderWithId[]) => void) | undefined;
    let ingredientsCallback: ((ingredients: IngredientWithId[]) => void) | undefined;

    subscribeAdminBoardOrdersMock.mockImplementation((onNext: (orders: OrderWithId[]) => void) => {
      ordersCallback = onNext;
      return vi.fn();
    });
    subscribeAllIngredientsMock.mockImplementation((onNext: (ingredients: IngredientWithId[]) => void) => {
      ingredientsCallback = onNext;
      return vi.fn();
    });

    const { result } = renderHook(() => useNavBadgeCounts(true));

    expect(result.current).toEqual({ pendingRequests: 0, lowStock: 0 });

    act(() => {
      ordersCallback?.([buildOrder('pending'), buildOrder('pending'), buildOrder('cooking')]);
      ingredientsCallback?.([buildIngredient({ quantity: 1 }), buildIngredient({ quantity: 20 })]);
    });

    expect(result.current).toEqual({ pendingRequests: 2, lowStock: 1 });
  });

  it('renders zero counts when there is nothing pending or low', () => {
    let ordersCallback: ((orders: OrderWithId[]) => void) | undefined;

    subscribeAdminBoardOrdersMock.mockImplementation((onNext: (orders: OrderWithId[]) => void) => {
      ordersCallback = onNext;
      return vi.fn();
    });
    subscribeAllIngredientsMock.mockImplementation(() => vi.fn());

    const { result } = renderHook(() => useNavBadgeCounts(true));

    act(() => {
      ordersCallback?.([buildOrder('cooking')]);
    });

    expect(result.current.pendingRequests).toBe(0);
  });
});
