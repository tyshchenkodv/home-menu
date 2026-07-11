import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  );

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

    renderDashboard();

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

    renderDashboard();

    await waitFor(() => {
      expect(mockSubscribeAdminBoardOrders).toHaveBeenCalled();
      expect(mockSubscribeAllBatches).toHaveBeenCalled();
      expect(mockSubscribeAllIngredients).toHaveBeenCalled();
    });
  });

  it('badges the review-requests row with the pending count', async () => {
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([
        { id: 'o1', status: 'pending' },
        { id: 'o2', status: 'pending' },
      ]);
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

    renderDashboard();

    const reviewRow = await screen.findByRole('link', { name: /Переглянути запити на приготування/i });
    expect(reviewRow).toHaveAttribute('href', '/admin/orders');
    expect(reviewRow).toHaveTextContent('2');
  });

  it('navigates to the menu when the ready-portions banner is clicked', async () => {
    const user = userEvent.setup();

    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([{ id: 'o1', status: 'pending' }]);
      return vi.fn();
    });
    mockSubscribeAllBatches.mockImplementation((onNext: (batches: unknown[]) => void) => {
      onNext([
        { id: 'b1', status: 'ready', availableQuantity: 18, expiresAt: { toMillis: () => Number.MAX_SAFE_INTEGER } },
      ]);
      return vi.fn();
    });
    mockSubscribeAllIngredients.mockImplementation((onNext: (ingredients: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/menu" element={<div>menu page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const banner = await screen.findByRole('button', { name: /Порцій вільно/i });
    expect(banner).toHaveTextContent('18');

    await user.click(banner);

    await waitFor(() => {
      expect(screen.getByText('menu page')).toBeInTheDocument();
    });
  });

  it('navigates when a summary tile is clicked', async () => {
    const user = userEvent.setup();

    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([{ id: 'o1', status: 'pending' }]);
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

    renderDashboard();

    const pendingTile = await screen.findByText('Запити');
    const tileButton = pendingTile.closest('button');
    if (!tileButton) throw new Error('tile button not found');

    await user.click(tileButton);

    await waitFor(() => {
      expect(screen.queryByText('Панель')).toBeInTheDocument();
    });
  });

  it('marks the expired batch tile with a non-color severity glyph', async () => {
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });
    mockSubscribeAllBatches.mockImplementation((onNext: (batches: unknown[]) => void) => {
      onNext([{ id: 'b1', status: 'ready', availableQuantity: 1, expiresAt: { toMillis: () => 0 } }]);
      return vi.fn();
    });
    mockSubscribeAllIngredients.mockImplementation((onNext: (ingredients: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    renderDashboard();

    const expiredLabel = await screen.findByText('Прострочено');
    const tile = expiredLabel.closest('button');
    expect(tile).not.toBeNull();
    expect(tile).toHaveTextContent('⚠');
  });
});
