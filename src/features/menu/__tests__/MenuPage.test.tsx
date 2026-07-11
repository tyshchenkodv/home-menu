import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../app/i18n';
import { theme } from '../../../app/theme';
import type { DishWithId } from '../../../shared/types/dish';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { OrderWithId } from '../../../shared/types/order';
import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';
import type { UserProfile } from '../../../shared/types/userProfile';

vi.mock('../../../infrastructure/firebase/services/dishService', () => ({
  subscribeActiveDishes: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeActiveIngredients: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/batchService', () => ({
  subscribeAvailableBatchesForDish: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/settingsService', () => ({
  getGeneralSettings: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/orderTransactions', async () => {
  const actual = await vi.importActual<typeof import('../../../infrastructure/firebase/services/orderTransactions')>(
    '../../../infrastructure/firebase/services/orderTransactions',
  );
  return { ...actual, reserveReadyOrder: vi.fn() };
});

vi.mock('../../../infrastructure/firebase/services/orderService', () => ({
  createCookingRequest: vi.fn(),
  subscribeOwnOrders: vi.fn(),
}));

vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { subscribeActiveDishes } from '../../../infrastructure/firebase/services/dishService';
import { subscribeActiveIngredients } from '../../../infrastructure/firebase/services/ingredientService';
import { subscribeAvailableBatchesForDish } from '../../../infrastructure/firebase/services/batchService';
import { getGeneralSettings } from '../../../infrastructure/firebase/services/settingsService';
import { createCookingRequest, subscribeOwnOrders } from '../../../infrastructure/firebase/services/orderService';
import { reserveReadyOrder } from '../../../infrastructure/firebase/services/orderTransactions';
import { useAuth } from '../../auth/useAuth';
import { MenuPage } from '../pages/MenuPage';

const mockedSubscribeActiveDishes = vi.mocked(subscribeActiveDishes);
const mockedSubscribeActiveIngredients = vi.mocked(subscribeActiveIngredients);
const mockedSubscribeAvailableBatches = vi.mocked(subscribeAvailableBatchesForDish);
const mockedGetGeneralSettings = vi.mocked(getGeneralSettings);
const mockedReserveReadyOrder = vi.mocked(reserveReadyOrder);
const mockedCreateCookingRequest = vi.mocked(createCookingRequest);
const mockedSubscribeOwnOrders = vi.mocked(subscribeOwnOrders);
const mockedUseAuth = vi.mocked(useAuth);

const USER_UID = 'test-user-uid';
const now = { toMillis: () => 0 } as never;

const buildDish = (overrides: Partial<DishWithId> = {}): DishWithId => ({
  id: 'dish-risotto',
  name: 'Грибне різото',
  description: '',
  mealTypes: ['breakfast'],
  recipeItems: [{ ingredientId: 'ingredient-1', ingredientName: 'Рис', requiredQuantity: 300, requiresPresence: null }],
  archivedAt: null,
  createdAt: now,
  createdBy: USER_UID,
  updatedAt: now,
  updatedBy: USER_UID,
  ...overrides,
});

const buildIngredient = (overrides: Partial<IngredientWithId> = {}): IngredientWithId => ({
  id: 'ingredient-1',
  name: 'Рис',
  trackingMode: 'quantity',
  baseUnit: 'gram',
  quantity: 1000,
  isPresent: null,
  lowStockThreshold: null,
  archivedAt: null,
  createdAt: now,
  createdBy: USER_UID,
  updatedAt: now,
  updatedBy: USER_UID,
  ...overrides,
});

const buildBatch = (overrides: Partial<PreparedBatchWithId> = {}): PreparedBatchWithId => ({
  id: 'batch-1',
  dishId: 'dish-risotto',
  dishName: 'Грибне різото',
  batchNumber: 1,
  producedQuantity: 4,
  availableQuantity: 4,
  reservedQuantity: 0,
  consumedQuantity: 0,
  discardedQuantity: 0,
  preparedAt: now,
  expiresAt: null,
  status: 'available',
  sourceCookingRequestId: null,
  createdAt: now,
  createdBy: USER_UID,
  updatedAt: now,
  updatedBy: USER_UID,
  ...overrides,
});

const buildOwnOrder = (overrides: Partial<OrderWithId> = {}): OrderWithId => ({
  id: 'order-own-1',
  userId: USER_UID,
  userDisplayName: 'Test User',
  dishId: 'dish-risotto',
  dishName: 'Грибне різото',
  kind: 'ready',
  status: 'reserved',
  quantity: 2,
  mealType: 'breakfast',
  scheduledFor: { toMillis: () => Date.now() } as never,
  allocations: [],
  rejectionReason: null,
  preparedBatchId: null,
  preparedBatchNumber: null,
  createdAt: now,
  createdBy: USER_UID,
  updatedAt: now,
  updatedBy: USER_UID,
  ...overrides,
});

const renderPage = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <MenuPage />
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>,
  );

const emitDishes = (dishes: DishWithId[]) => {
  mockedSubscribeActiveDishes.mockImplementation((onNext): Unsubscribe => {
    onNext(dishes);
    return vi.fn();
  });
};

const emitIngredients = (ingredients: IngredientWithId[]) => {
  mockedSubscribeActiveIngredients.mockImplementation((onNext): Unsubscribe => {
    onNext(ingredients);
    return vi.fn();
  });
};

const emitBatches = (batches: PreparedBatchWithId[]) => {
  mockedSubscribeAvailableBatches.mockImplementation((_dishId, onNext): Unsubscribe => {
    onNext(batches);
    return vi.fn();
  });
};

const emitOwnOrders = (orders: OrderWithId[]) => {
  mockedSubscribeOwnOrders.mockImplementation((_userId, onNext): Unsubscribe => {
    onNext(orders);
    return vi.fn();
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  void i18n.changeLanguage('uk');

  mockedUseAuth.mockReturnValue({
    user: { uid: USER_UID } as unknown as User,
    profile: { displayName: 'Test User', role: 'user', active: true } as unknown as UserProfile,
    role: 'user',
    isActive: true,
    status: 'authenticated',
  });

  mockedSubscribeActiveDishes.mockReturnValue(vi.fn());
  mockedSubscribeActiveIngredients.mockReturnValue(vi.fn());
  mockedSubscribeAvailableBatches.mockReturnValue(vi.fn());
  mockedSubscribeOwnOrders.mockReturnValue(vi.fn());
  mockedGetGeneralSettings.mockResolvedValue({
    timezone: 'Europe/Kyiv',
    defaultMealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
  });
  mockedReserveReadyOrder.mockResolvedValue('order-1');
  mockedCreateCookingRequest.mockResolvedValue('order-2');
});

describe('MenuPage data states', () => {
  it('shows a loading state before settings and subscriptions resolve, with skeleton cards', () => {
    renderPage();

    expect(screen.getByText('Завантажуємо меню…')).toBeInTheDocument();
    expect(screen.getAllByTestId('menu-loading-skeleton-card')).toHaveLength(2);
  });

  it('shows an error state (with headline + retry) when the dish subscription fails', async () => {
    const user = userEvent.setup();
    mockedSubscribeActiveDishes.mockImplementation((_onNext, onError): Unsubscribe => {
      onError(new Error('boom'));
      return vi.fn();
    });
    emitIngredients([]);

    renderPage();

    expect(await screen.findByText('Не вдалося завантажити')).toBeInTheDocument();
    expect(screen.getByText("Перевірте з'єднання і спробуйте ще раз.")).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'Повторити' });

    await user.click(retryButton);
    await waitFor(() => {
      expect(mockedGetGeneralSettings).toHaveBeenCalledTimes(2);
    });
  });

  it('shows an empty state (with headline) when no dish qualifies for the selected meal', async () => {
    emitDishes([]);
    emitIngredients([]);

    renderPage();

    expect(await screen.findByText('На цей день нічого немає')).toBeInTheDocument();
    expect(
      screen.getByText('Жодна страва не готова й не може бути приготована. Загляньте на інший день.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Інший день' })).toBeInTheDocument();
  });

  it('renders a ready-now dish card with the Reserve action', async () => {
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([buildBatch()]);

    renderPage();

    expect(await screen.findByText('Грибне різото')).toBeInTheDocument();
    expect(screen.getByText('Готово зараз')).toBeInTheDocument();
    expect(screen.getByText('4 вільно')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зарезервувати' })).toBeInTheDocument();
  });

  it('renders a can-be-cooked dish card with the Request action when no portions are ready', async () => {
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([]);

    renderPage();

    expect(await screen.findByText('Грибне різото')).toBeInTheDocument();
    expect(screen.getByText('Можна приготувати')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Запит' })).toBeInTheDocument();
  });

  it('shows the already-reserved hint for the selected slot and clears it when the day changes', async () => {
    const user = userEvent.setup();
    emitDishes([buildDish({ mealTypes: ['breakfast', 'lunch', 'dinner'] })]);
    emitIngredients([buildIngredient()]);
    emitBatches([buildBatch()]);
    emitOwnOrders([buildOwnOrder({ mealType: 'breakfast', quantity: 2 })]);

    renderPage();

    expect(await screen.findByText('Вже зарезервовано: 2')).toBeInTheDocument();

    const nextDayChip = screen.getAllByRole('button', { name: /,/ })[1];
    await user.click(nextDayChip);

    await waitFor(() => {
      expect(screen.queryByText('Вже зарезервовано: 2')).not.toBeInTheDocument();
    });
  });
});

describe('MenuPage expired-batch banner', () => {
  const expiredTimestamp = { toMillis: () => Date.UTC(2020, 0, 1) } as never;

  it('shows the expired-batch banner to an admin when a dish is backed by an expired batch', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'admin-uid' } as unknown as User,
      profile: { displayName: 'Admin', role: 'admin', active: true } as unknown as UserProfile,
      role: 'admin',
      isActive: true,
      status: 'authenticated',
    });
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([buildBatch({ expiresAt: expiredTimestamp })]);

    renderPage();

    expect(await screen.findByText('⚠ Прострочено')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'До доступних порцій →' })).toBeInTheDocument();
  });

  it('never shows the expired-batch banner to a regular user, even with an expired backing batch', async () => {
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([buildBatch({ expiresAt: expiredTimestamp })]);

    renderPage();

    await screen.findByText('Грибне різото');
    expect(screen.queryByText('⚠ Прострочено')).not.toBeInTheDocument();
  });

  it('hides the expired-batch banner for an admin-role claim marked inactive (claims-derived, not profile)', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'admin-uid' } as unknown as User,
      profile: { displayName: 'Admin', role: 'admin', active: true } as unknown as UserProfile,
      role: 'admin',
      isActive: false,
      status: 'authenticated',
    });
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([buildBatch({ expiresAt: expiredTimestamp })]);

    renderPage();

    await screen.findByText('Грибне різото');
    expect(screen.queryByText('⚠ Прострочено')).not.toBeInTheDocument();
  });

  it('shows no banner to an admin when no backing batch is expired', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'admin-uid' } as unknown as User,
      profile: { displayName: 'Admin', role: 'admin', active: true } as unknown as UserProfile,
      role: 'admin',
      isActive: true,
      status: 'authenticated',
    });
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([buildBatch()]);

    renderPage();

    await screen.findByText('Грибне різото');
    expect(screen.queryByText('⚠ Прострочено')).not.toBeInTheDocument();
  });
});

describe('MenuPage reservation flow', () => {
  it('opens the reserve dialog and confirms via reserveReadyOrder', async () => {
    const user = userEvent.setup();
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([buildBatch()]);

    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Зарезервувати' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Зарезервувати порції')).toBeInTheDocument();
    // Subtitle includes a real (non-blank) date segment, not just the dish + count.
    expect(within(dialog).getByText(/^Грибне різото · .+ · вільно 4 порції$/)).toBeInTheDocument();
    // Meal-category tag chip next to the title.
    expect(within(dialog).getByText('Сніданок')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Зарезервувати' }));

    await waitFor(() => {
      expect(mockedReserveReadyOrder).toHaveBeenCalledTimes(1);
    });
    expect(mockedReserveReadyOrder).toHaveBeenCalledWith(
      expect.objectContaining({ dishId: 'dish-risotto', quantity: 1, mealType: 'breakfast', userId: USER_UID }),
    );
  });
});

describe('MenuPage cooking-request flow', () => {
  it('opens the cooking-request dialog and confirms via createCookingRequest', async () => {
    const user = userEvent.setup();
    emitDishes([buildDish()]);
    emitIngredients([buildIngredient()]);
    emitBatches([]);

    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Запит' }));
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Надіслати запит' }));

    await waitFor(() => {
      expect(mockedCreateCookingRequest).toHaveBeenCalledTimes(1);
    });
    expect(mockedCreateCookingRequest).toHaveBeenCalledWith(
      expect.objectContaining({ dishId: 'dish-risotto', quantity: 1, mealType: 'breakfast' }),
      USER_UID,
      'Test User',
    );
  });
});
