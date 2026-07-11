import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../app/i18n';
import { theme } from '../../../app/theme';
import type { OrderWithId } from '../../../shared/types/order';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';
import type { UserProfile } from '../../../shared/types/userProfile';

vi.mock('../../../infrastructure/firebase/services/orderService', () => ({
  subscribeOwnOrders: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/batchService', () => ({
  getBatchesByIds: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/orderTransactions', async () => {
  const actual = await vi.importActual<typeof import('../../../infrastructure/firebase/services/orderTransactions')>(
    '../../../infrastructure/firebase/services/orderTransactions',
  );
  return { ...actual, cancelOrder: vi.fn() };
});

vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { getBatchesByIds } from '../../../infrastructure/firebase/services/batchService';
import { subscribeOwnOrders } from '../../../infrastructure/firebase/services/orderService';
import { cancelOrder } from '../../../infrastructure/firebase/services/orderTransactions';
import { useAuth } from '../../auth/useAuth';
import { OrdersPage } from '../pages/OrdersPage';

const mockedSubscribeOwnOrders = vi.mocked(subscribeOwnOrders);
const mockedGetBatchesByIds = vi.mocked(getBatchesByIds);
const mockedCancelOrder = vi.mocked(cancelOrder);
const mockedUseAuth = vi.mocked(useAuth);

const USER_UID = 'test-user-uid';
const NOW_MILLIS = 1_700_000_000_000;
const FUTURE = { toMillis: () => NOW_MILLIS + 3_600_000 } as never;
const PAST = { toMillis: () => NOW_MILLIS - 3_600_000 } as never;

const buildOrder = (overrides: Partial<OrderWithId> = {}): OrderWithId =>
  ({
    id: 'order-1',
    userId: USER_UID,
    userDisplayName: 'Test User',
    dishId: 'dish-risotto',
    dishName: 'Грибне різото',
    kind: 'ready',
    status: 'reserved',
    quantity: 2,
    mealType: 'lunch',
    scheduledFor: FUTURE,
    allocations: [{ batchId: 'batch-1', quantity: 2 }],
    rejectionReason: null,
    preparedBatchId: null,
    createdAt: PAST,
    createdBy: USER_UID,
    updatedAt: PAST,
    updatedBy: USER_UID,
    ...overrides,
  }) as unknown as OrderWithId;

const buildBatch = (overrides: Partial<PreparedBatchWithId> = {}): PreparedBatchWithId =>
  ({
    id: 'batch-1',
    dishId: 'dish-risotto',
    dishName: 'Грибне різото',
    producedQuantity: 4,
    availableQuantity: 0,
    reservedQuantity: 2,
    consumedQuantity: 0,
    discardedQuantity: 0,
    preparedAt: PAST,
    expiresAt: null,
    status: 'available',
    sourceCookingRequestId: null,
    createdAt: PAST,
    createdBy: USER_UID,
    updatedAt: PAST,
    updatedBy: USER_UID,
    ...overrides,
  }) as unknown as PreparedBatchWithId;

const renderPage = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/orders']}>
          <Routes>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/menu" element={<div>Menu screen</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>,
  );

const emitOrders = (orders: OrderWithId[]) => {
  mockedSubscribeOwnOrders.mockImplementation((_userId, onNext): Unsubscribe => {
    onNext(orders);
    return vi.fn();
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(NOW_MILLIS);
  void i18n.changeLanguage('uk');

  mockedUseAuth.mockReturnValue({
    user: { uid: USER_UID } as unknown as User,
    profile: { displayName: 'Test User', role: 'user', active: true } as unknown as UserProfile,
    status: 'authenticated',
  });

  mockedSubscribeOwnOrders.mockReturnValue(vi.fn());
  mockedGetBatchesByIds.mockResolvedValue([]);
  mockedCancelOrder.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OrdersPage data states', () => {
  it('shows a loading state before the subscription resolves', () => {
    renderPage();

    expect(screen.getByText('Завантажуємо замовлення…')).toBeInTheDocument();
  });

  it('shows an error state (with retry) when the subscription fails', async () => {
    const user = userEvent.setup();
    mockedSubscribeOwnOrders.mockImplementation((_userId, _onNext, onError): Unsubscribe => {
      onError(new Error('boom'));
      return vi.fn();
    });

    renderPage();

    expect(await screen.findByText('Не вдалося отримати ваші замовлення.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторити' }));

    await waitFor(() => {
      expect(mockedSubscribeOwnOrders).toHaveBeenCalledTimes(2);
    });
  });

  it('shows an empty state with a CTA that navigates to the menu', async () => {
    const user = userEvent.setup();
    emitOrders([]);

    renderPage();

    expect(
      await screen.findByText('Миска Котика порожня. Загляньте в меню й зарезервуйте страву.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'До меню' }));

    expect(await screen.findByText('Menu screen')).toBeInTheDocument();
  });
});

describe('OrdersPage status matrix', () => {
  it('renders a pending cooking request with an enabled cancel action', async () => {
    emitOrders([buildOrder({ kind: 'cook', status: 'pending', allocations: [] })]);

    renderPage();

    expect(await screen.findByText('Очікує')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скасувати замовлення' })).toBeEnabled();
  });

  it('renders a cooking request as visibly-disabled-cancel with the explanatory caption', async () => {
    emitOrders([buildOrder({ kind: 'cook', status: 'cooking', allocations: [] })]);

    renderPage();

    expect(await screen.findByText('Готується')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скасувати — недоступно' })).toBeDisabled();
    expect(screen.getByText('Скасування вимкнено, щойно почалося готування.')).toBeInTheDocument();
  });

  it('renders a prepared request with no buttons and the automatic-reservation caption', async () => {
    emitOrders([buildOrder({ kind: 'cook', status: 'prepared', allocations: [] })]);

    renderPage();

    expect(await screen.findByText('Приготовано')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Скасувати/ })).not.toBeInTheDocument();
    expect(screen.getByText('Без кнопок — порції резервуються автоматично з партії.')).toBeInTheDocument();
  });

  it('renders a reserved order with an enabled cancel action and a batch-expired warning', async () => {
    mockedGetBatchesByIds.mockResolvedValue([buildBatch({ status: 'discarded' })]);
    emitOrders([buildOrder({ status: 'reserved' })]);

    renderPage();

    expect(await screen.findByText('Зарезервовано')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скасувати замовлення' })).toBeEnabled();
    expect(
      await screen.findByText("Пов'язана партія прострочена або утилізована. Зверніться до адміністратора."),
    ).toBeInTheDocument();
  });

  it('renders a rejected request with its reason and no buttons', async () => {
    emitOrders([
      buildOrder({ kind: 'cook', status: 'rejected', allocations: [], rejectionReason: 'Не вистачає борошна' }),
    ]);

    renderPage();

    expect(await screen.findByText('Відхилено')).toBeInTheDocument();
    expect(screen.getByText('Причина: Не вистачає борошна')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('derives a "consumed" display for a still-persisted reserved order once now >= scheduledFor', async () => {
    emitOrders([buildOrder({ status: 'reserved', scheduledFor: PAST })]);

    renderPage();

    expect(await screen.findByText('Спожито')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Скасувати/ })).not.toBeInTheDocument();
  });
});

describe('OrdersPage tabs', () => {
  it('splits orders between the Active and History tabs', async () => {
    const user = userEvent.setup();
    emitOrders([
      buildOrder({ id: 'order-active', status: 'reserved' }),
      buildOrder({ id: 'order-terminal', kind: 'cook', status: 'cancelled', allocations: [] }),
    ]);

    renderPage();

    await screen.findByText('Зарезервовано');
    // The terminal order shows in the "Earlier" section of the Active tab too.
    expect(screen.getAllByText('Скасовано').length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole('tab', { name: 'Історія' }));

    expect(await screen.findByText('Скасовано')).toBeInTheDocument();
    expect(screen.queryByText('Зарезервовано')).not.toBeInTheDocument();
  });
});

describe('OrdersPage cancellation flow', () => {
  it('opens the cancel dialog and confirms via cancelOrder', async () => {
    const user = userEvent.setup();
    emitOrders([buildOrder({ id: 'order-1', status: 'reserved' })]);

    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Скасувати замовлення' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Скасувати замовлення?');

    await user.click(within(dialog).getByRole('button', { name: 'Скасувати замовлення' }));

    await waitFor(() => {
      expect(mockedCancelOrder).toHaveBeenCalledWith({ orderId: 'order-1', userId: USER_UID });
    });
  });
});
