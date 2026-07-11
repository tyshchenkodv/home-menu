import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../../../app/i18n';
import type { AuthContextValue } from '../../auth/authContextValue';

const ADMIN_USER = { uid: 'admin-uid', email: 'admin@example.test' } as unknown as User;

vi.mock('../../auth/useAuth', () => ({
  useAuth: (): AuthContextValue => ({ user: ADMIN_USER, profile: null, status: 'authenticated' }),
}));

const { AdminOrdersPage } = await import('../pages/AdminOrdersPage');

const mockSubscribeAdminBoardOrders = vi.fn();
const mockSubscribeAdminHistoryOrders = vi.fn();

vi.mock('../../../infrastructure/firebase/services/orderService', () => ({
  subscribeAdminBoardOrders: (...args: unknown[]): unknown => mockSubscribeAdminBoardOrders(...args),
  subscribeAdminHistoryOrders: (...args: unknown[]): unknown => mockSubscribeAdminHistoryOrders(...args),
}));

const mockApproveRequest = vi.fn();
const mockRejectRequest = vi.fn();
const mockStartCooking = vi.fn();
const mockCompleteCooking = vi.fn();
const mockCorrectOrder = vi.fn();
const mockNormalizeConsumedOrders = vi.fn<(nowMillis: number, adminUid: string) => Promise<void>>(() =>
  Promise.resolve(),
);

vi.mock('../../../infrastructure/firebase/services/orderTransactions', () => ({
  approveRequest: (...args: unknown[]): unknown => mockApproveRequest(...args),
  rejectRequest: (...args: unknown[]): unknown => mockRejectRequest(...args),
  startCooking: (...args: unknown[]): unknown => mockStartCooking(...args),
  completeCooking: (...args: unknown[]): unknown => mockCompleteCooking(...args),
  correctOrder: (...args: unknown[]): unknown => mockCorrectOrder(...args),
  normalizeConsumedOrders: (...args: unknown[]): unknown => mockNormalizeConsumedOrders(...(args as [number, string])),
}));

const scheduledFor = { toMillis: () => 1_700_000_000_000 };

const buildOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  userId: 'user-1',
  userDisplayName: 'Olena',
  dishId: 'dish-1',
  dishName: 'Mushroom risotto',
  kind: 'cook' as const,
  status: 'pending' as const,
  quantity: 2,
  mealType: 'lunch' as const,
  scheduledFor,
  allocations: [],
  rejectionReason: null,
  preparedBatchId: null,
  createdAt: scheduledFor,
  createdBy: 'user-1',
  updatedAt: scheduledFor,
  updatedBy: 'user-1',
  ...overrides,
});

function renderPage() {
  return render(<AdminOrdersPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscribeAdminBoardOrders.mockImplementation(() => vi.fn());
  mockSubscribeAdminHistoryOrders.mockImplementation(() => vi.fn());
});

describe('AdminOrdersPage', () => {
  it('renders the translated heading and board tab by default', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Запити на готування' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Дошка' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the empty state when the board has no orders', async () => {
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Нових запитів на готування поки немає — дошка порожня.')).toBeInTheDocument();
    });
  });

  it('renders a pending request with Approve/Reject and approves it', async () => {
    const user = userEvent.setup();
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([buildOrder()]);
      return vi.fn();
    });
    mockApproveRequest.mockResolvedValue(undefined);

    renderPage();

    const card = await screen.findByTestId('admin-order-card');
    await user.click(within(card).getByRole('button', { name: 'Підтвердити' }));

    expect(mockApproveRequest).toHaveBeenCalledWith('order-1', 'admin-uid');
  });

  it('opens the reject dialog and submits an optional reason', async () => {
    const user = userEvent.setup();
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([buildOrder()]);
      return vi.fn();
    });
    mockRejectRequest.mockResolvedValue(undefined);

    renderPage();

    const card = await screen.findByTestId('admin-order-card');
    await user.click(within(card).getByRole('button', { name: 'Відхилити' }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText("Причина (необов'язково)"), 'Out of flour');
    await user.click(within(dialog).getByRole('button', { name: 'Відхилити' }));

    await waitFor(() => {
      expect(mockRejectRequest).toHaveBeenCalledWith({
        orderId: 'order-1',
        adminUid: 'admin-uid',
        reason: 'Out of flour',
      });
    });
  });

  it('opens the correction dialog and keeps Save disabled until a reason is entered', async () => {
    const user = userEvent.setup();
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([buildOrder({ status: 'approved' })]);
      return vi.fn();
    });
    mockCorrectOrder.mockResolvedValue(undefined);

    renderPage();

    const card = await screen.findByTestId('admin-order-card');
    await user.click(within(card).getByRole('button', { name: 'Скоригувати' }));

    const dialog = await screen.findByRole('dialog');
    const saveButton = within(dialog).getByRole('button', { name: 'Зберегти' });
    expect(saveButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Причина/), 'Batch spoiled');
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCorrectOrder).toHaveBeenCalledWith({
        orderId: 'order-1',
        adminUid: 'admin-uid',
        reason: 'Batch spoiled',
      });
    });
  });

  it('normalizes consumed orders once the History tab opens', async () => {
    const user = userEvent.setup();
    mockSubscribeAdminBoardOrders.mockImplementation((onNext: (orders: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });
    mockSubscribeAdminHistoryOrders.mockImplementation((_statuses: unknown, onNext: (orders: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Історія' }));

    await waitFor(() => {
      expect(mockNormalizeConsumedOrders).toHaveBeenCalledWith(expect.any(Number), 'admin-uid');
    });
  });

  it('shows the error state and retries the subscription', async () => {
    const user = userEvent.setup();
    mockSubscribeAdminBoardOrders.mockImplementationOnce((_onNext: unknown, onError: (error: Error) => void) => {
      onError(new Error('boom'));
      return vi.fn();
    });
    mockSubscribeAdminBoardOrders.mockImplementationOnce((onNext: (orders: unknown[]) => void) => {
      onNext([]);
      return vi.fn();
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Спробуйте оновити.')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Повторити' }));

    await waitFor(() => {
      expect(screen.getByText('Нових запитів на готування поки немає — дошка порожня.')).toBeInTheDocument();
    });
  });
});
