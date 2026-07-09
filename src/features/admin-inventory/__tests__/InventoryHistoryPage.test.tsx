import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';

import { i18n } from '../../../app/i18n';
import { theme } from '../../../app/theme';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { InventoryMovementWithId } from '../../../shared/types/inventoryMovement';
import type { UserProfile } from '../../../shared/types/userProfile';

vi.mock('../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeActiveIngredients: vi.fn(),
  subscribeArchivedIngredients: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/inventoryMovementService', () => ({
  subscribeMovements: vi.fn(),
}));

vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

import {
  subscribeActiveIngredients,
  subscribeArchivedIngredients,
} from '../../../infrastructure/firebase/services/ingredientService';
import { subscribeMovements } from '../../../infrastructure/firebase/services/inventoryMovementService';
import { useAuth } from '../../auth/useAuth';
import { InventoryHistoryPage } from '../pages/InventoryHistoryPage';

const mockedSubscribeActive = vi.mocked(subscribeActiveIngredients);
const mockedSubscribeArchived = vi.mocked(subscribeArchivedIngredients);
const mockedSubscribeMovements = vi.mocked(subscribeMovements);
const mockedUseAuth = vi.mocked(useAuth);

const ADMIN_UID = 'test-admin-uid';

const buildIngredient = (overrides: Partial<IngredientWithId> = {}): IngredientWithId => ({
  id: 'ingredient-1',
  name: 'Борошно',
  trackingMode: 'quantity',
  baseUnit: 'gram',
  quantity: 2000,
  isPresent: null,
  lowStockThreshold: 500,
  archivedAt: null,
  createdAt: { toMillis: () => 0 } as never,
  createdBy: ADMIN_UID,
  updatedAt: { toMillis: () => 0 } as never,
  updatedBy: ADMIN_UID,
  ...overrides,
});

const buildMovement = (overrides: Partial<InventoryMovementWithId> = {}): InventoryMovementWithId => ({
  id: 'movement-1',
  ingredientId: 'ingredient-1',
  ingredientName: 'Борошно',
  type: 'restock',
  deltaQuantity: 500,
  presenceBefore: null,
  presenceAfter: null,
  balanceAfter: 2500,
  cookingRequestId: null,
  preparedBatchId: null,
  note: null,
  createdAt: { toMillis: () => Date.UTC(2026, 0, 15, 10, 30) } as never,
  createdBy: ADMIN_UID,
  ...overrides,
});

const renderPage = (initialEntry = '/admin/inventory/history') => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <InventoryHistoryPage />
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>,
  );
};

const emitActive = (ingredients: IngredientWithId[]) => {
  mockedSubscribeActive.mockImplementation((onNext): Unsubscribe => {
    onNext(ingredients);
    return vi.fn();
  });
};

const emitArchived = (ingredients: IngredientWithId[]) => {
  mockedSubscribeArchived.mockImplementation((onNext): Unsubscribe => {
    onNext(ingredients);
    return vi.fn();
  });
};

const emitMovements = (movements: InventoryMovementWithId[]) => {
  mockedSubscribeMovements.mockImplementation((_options, onNext): Unsubscribe => {
    onNext(movements);
    return vi.fn();
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  void i18n.changeLanguage('uk');

  mockedUseAuth.mockReturnValue({
    user: { uid: ADMIN_UID } as unknown as User,
    profile: { role: 'admin', active: true } as unknown as UserProfile,
    status: 'authenticated',
  });

  mockedSubscribeActive.mockReturnValue(vi.fn());
  mockedSubscribeArchived.mockReturnValue(vi.fn());
  mockedSubscribeMovements.mockReturnValue(vi.fn());
});

describe('InventoryHistoryPage states', () => {
  it('shows a loading state before the movements subscription emits', () => {
    renderPage();

    expect(screen.getByText('Завантаження історії…')).toBeInTheDocument();
  });

  it('shows an error state when the movements subscription fails', () => {
    mockedSubscribeMovements.mockImplementation((_options, _onNext, onError): Unsubscribe => {
      onError(new Error('boom'));
      return vi.fn();
    });

    renderPage();

    expect(screen.getByText('Не вдалося завантажити історію')).toBeInTheDocument();
  });

  it('shows an empty state when there are no movements', () => {
    emitMovements([]);

    renderPage();

    expect(screen.getByText('Історія порожня')).toBeInTheDocument();
  });
});

describe('InventoryHistoryPage ready state entries', () => {
  it('renders a quantity movement with ingredient name, type, delta, balance, note, and time', () => {
    emitActive([buildIngredient()]);
    emitArchived([]);
    emitMovements([
      buildMovement({
        type: 'correction',
        deltaQuantity: -200,
        balanceAfter: 1800,
        note: 'Звірка залишків',
      }),
    ]);

    renderPage();

    expect(screen.getByRole('heading', { name: 'Борошно' })).toBeInTheDocument();
    expect(screen.getByText('Коригування')).toBeInTheDocument();
    expect(screen.getByText('-200 г')).toBeInTheDocument();
    expect(screen.getByText('1800 г')).toBeInTheDocument();
    expect(screen.getByText(/Звірка залишків/)).toBeInTheDocument();
  });

  it('renders a positive quantity delta with a leading plus sign', () => {
    emitActive([buildIngredient()]);
    emitArchived([]);
    emitMovements([buildMovement({ type: 'restock', deltaQuantity: 500, balanceAfter: 2500, note: null })]);

    renderPage();

    expect(screen.getByText('+500 г')).toBeInTheDocument();
    expect(screen.getByText('2500 г')).toBeInTheDocument();
  });

  it('does not render a note row when note is null', () => {
    emitActive([buildIngredient()]);
    emitArchived([]);
    emitMovements([buildMovement({ note: null })]);

    renderPage();

    expect(screen.queryByText(/Примітка/)).not.toBeInTheDocument();
  });

  it('renders a presence movement as an absent-to-present transition without a balance', () => {
    emitActive([
      buildIngredient({ id: 'salt-1', name: 'Сіль', trackingMode: 'presence', baseUnit: 'presence', quantity: null }),
    ]);
    emitArchived([]);
    emitMovements([
      buildMovement({
        ingredientId: 'salt-1',
        ingredientName: 'Сіль',
        type: 'restock',
        deltaQuantity: null,
        presenceBefore: false,
        presenceAfter: true,
        balanceAfter: null,
      }),
    ]);

    renderPage();

    expect(screen.getByText('Відсутній → У наявності')).toBeInTheDocument();
  });
});

describe('InventoryHistoryPage ingredient filter', () => {
  it('narrows the subscription to the selected ingredient via a new subscription', async () => {
    const user = userEvent.setup();
    const unsubscribeAll = vi.fn();
    mockedSubscribeMovements.mockImplementation((_options, onNext): Unsubscribe => {
      onNext([]);
      return unsubscribeAll;
    });
    emitActive([buildIngredient({ id: 'ingredient-1', name: 'Борошно' })]);
    emitArchived([buildIngredient({ id: 'ingredient-2', name: 'Цукор', archivedAt: { toMillis: () => 1 } as never })]);

    renderPage();
    expect(mockedSubscribeMovements).toHaveBeenCalledTimes(1);
    expect(mockedSubscribeMovements).toHaveBeenLastCalledWith(
      { ingredientId: undefined },
      expect.any(Function),
      expect.any(Function),
    );

    await user.selectOptions(screen.getByLabelText('Фільтр за інгредієнтом'), 'ingredient-2');

    await waitFor(() => {
      expect(mockedSubscribeMovements).toHaveBeenCalledTimes(2);
    });
    expect(unsubscribeAll).toHaveBeenCalledTimes(1);
    expect(mockedSubscribeMovements).toHaveBeenLastCalledWith(
      { ingredientId: 'ingredient-2' },
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('preselects the filter and uses ingredientId in the initial subscription from the URL', () => {
    emitActive([buildIngredient({ id: 'ingredient-1', name: 'Борошно' })]);
    emitArchived([]);
    emitMovements([]);

    renderPage('/admin/inventory/history?ingredientId=ingredient-1');

    expect(mockedSubscribeMovements).toHaveBeenCalledWith(
      { ingredientId: 'ingredient-1' },
      expect.any(Function),
      expect.any(Function),
    );
    expect(screen.getByLabelText('Фільтр за інгредієнтом')).toHaveValue('ingredient-1');
  });

  it('resubscribes without an ingredientId when the filter is cleared', async () => {
    const user = userEvent.setup();
    emitActive([buildIngredient({ id: 'ingredient-1', name: 'Борошно' })]);
    emitArchived([]);
    emitMovements([]);

    renderPage('/admin/inventory/history?ingredientId=ingredient-1');
    expect(mockedSubscribeMovements).toHaveBeenCalledTimes(1);

    await user.selectOptions(screen.getByLabelText('Фільтр за інгредієнтом'), '');

    await waitFor(() => {
      expect(mockedSubscribeMovements).toHaveBeenCalledTimes(2);
    });
    expect(mockedSubscribeMovements).toHaveBeenLastCalledWith(
      { ingredientId: undefined },
      expect.any(Function),
      expect.any(Function),
    );
  });
});
