import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../../../app/i18n';

const mockSubscribeAdminBoardOrders = vi.fn();
const mockSubscribeAllBatches = vi.fn();
const mockSubscribeAllIngredients = vi.fn();

vi.mock('../../../infrastructure/firebase/services/orderService', () => ({
  subscribeAdminBoardOrders: (...args: unknown[]): unknown => mockSubscribeAdminBoardOrders(...args),
}));

vi.mock('../../../infrastructure/firebase/services/batchService', () => ({
  subscribeAllBatches: (...args: unknown[]): unknown => mockSubscribeAllBatches(...args),
}));

vi.mock('../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeAllIngredients: (...args: unknown[]): unknown => mockSubscribeAllIngredients(...args),
}));

const { AdminDashboardPage } = await import('../pages/AdminDashboardPage');

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders its translated heading', async () => {
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });
    mockSubscribeAllBatches.mockImplementation((onNext: (batches: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });
    mockSubscribeAllIngredients.mockImplementation((onNext: (ingredients: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Панель' })).toBeInTheDocument();
    });
  });

  it('subscribes to all data sources on mount', async () => {
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });
    mockSubscribeAllBatches.mockImplementation((onNext: (batches: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });
    mockSubscribeAllIngredients.mockImplementation((onNext: (ingredients: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(mockSubscribeAdminBoardOrders).toHaveBeenCalled();
      expect(mockSubscribeAllBatches).toHaveBeenCalled();
      expect(mockSubscribeAllIngredients).toHaveBeenCalled();
    });
  });
});
