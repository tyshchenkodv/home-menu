import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../app/i18n';
import { theme } from '../../../app/theme';
import { ThemeProvider } from '@mui/material/styles';
import type { User } from 'firebase/auth';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { UserProfile } from '../../../shared/types/userProfile';
import type { Unsubscribe } from 'firebase/firestore';

vi.mock('../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeActiveIngredients: vi.fn(),
  subscribeArchivedIngredients: vi.fn(),
  createIngredient: vi.fn(),
  updateIngredient: vi.fn(),
  archiveIngredient: vi.fn(),
  restoreIngredient: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/inventoryMovementService', () => ({
  subscribeMovements: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/inventoryTransactions', () => ({
  restockIngredient: vi.fn(),
  correctIngredientQuantity: vi.fn(),
  markIngredientPresent: vi.fn(),
  markIngredientAbsent: vi.fn(),
}));

vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

import {
  archiveIngredient,
  createIngredient,
  restoreIngredient,
  subscribeActiveIngredients,
  subscribeArchivedIngredients,
  updateIngredient,
} from '../../../infrastructure/firebase/services/ingredientService';
import { subscribeMovements } from '../../../infrastructure/firebase/services/inventoryMovementService';
import {
  correctIngredientQuantity,
  markIngredientAbsent,
  markIngredientPresent,
  restockIngredient,
} from '../../../infrastructure/firebase/services/inventoryTransactions';
import { useAuth } from '../../auth/useAuth';
import { InventoryPage } from '../pages/InventoryPage';

const mockedSubscribeActive = vi.mocked(subscribeActiveIngredients);
const mockedSubscribeArchived = vi.mocked(subscribeArchivedIngredients);
const mockedCreateIngredient = vi.mocked(createIngredient);
const mockedUpdateIngredient = vi.mocked(updateIngredient);
const mockedArchiveIngredient = vi.mocked(archiveIngredient);
const mockedRestoreIngredient = vi.mocked(restoreIngredient);
const mockedSubscribeMovements = vi.mocked(subscribeMovements);
const mockedRestockIngredient = vi.mocked(restockIngredient);
const mockedCorrectIngredientQuantity = vi.mocked(correctIngredientQuantity);
const mockedMarkIngredientPresent = vi.mocked(markIngredientPresent);
const mockedMarkIngredientAbsent = vi.mocked(markIngredientAbsent);
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

const renderPage = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <InventoryPage />
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

/** Opens an ingredient card's overflow menu so its action items become queryable. */
const openCardMenu = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('button', { name: `Більше дій для «${name}»` }));
  return screen.findByRole('menu');
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
  mockedRestockIngredient.mockResolvedValue(undefined);
  mockedCorrectIngredientQuantity.mockResolvedValue(undefined);
  mockedMarkIngredientPresent.mockResolvedValue(undefined);
  mockedMarkIngredientAbsent.mockResolvedValue(undefined);
});

describe('InventoryPage states', () => {
  it('shows a loading state before the active subscription emits', () => {
    const { container } = renderPage();

    expect(screen.getByText('Завантаження інгредієнтів…')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows an error state when the active subscription fails', () => {
    mockedSubscribeActive.mockImplementation((_onNext, onError): Unsubscribe => {
      onError(new Error('boom'));
      return vi.fn();
    });

    const { container } = renderPage();

    expect(screen.getByText('Не вдалося завантажити інгредієнти')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows an empty state when there are no active ingredients', () => {
    emitActive([]);

    const { container } = renderPage();

    expect(screen.getByText('Активних інгредієнтів ще немає')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the ready list of active ingredients', () => {
    emitActive([buildIngredient({ id: 'a', name: 'Борошно' }), buildIngredient({ id: 'b', name: 'Цукор' })]);

    renderPage();

    expect(screen.getByText('Борошно')).toBeInTheDocument();
    expect(screen.getByText('Цукор')).toBeInTheDocument();
  });
});

describe('InventoryPage tabs', () => {
  it('unsubscribes the active feed and subscribes archived when switching tabs', async () => {
    const user = userEvent.setup();
    const unsubscribeActive = vi.fn();
    mockedSubscribeActive.mockImplementation((onNext): Unsubscribe => {
      onNext([buildIngredient()]);
      return unsubscribeActive;
    });
    emitArchived([]);

    renderPage();
    expect(mockedSubscribeActive).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('tab', { name: 'Архівні' }));

    await waitFor(() => {
      expect(mockedSubscribeArchived).toHaveBeenCalledTimes(1);
    });
    expect(unsubscribeActive).toHaveBeenCalledTimes(1);
  });
});

describe('InventoryPage create dialog', () => {
  it('creates a quantity ingredient entered as 1.5 kg using the canonical base unit', async () => {
    const user = userEvent.setup();
    emitActive([]);
    mockedCreateIngredient.mockResolvedValue('new-id');

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Додати інгредієнт' }));

    await user.type(screen.getByLabelText('Назва'), 'Молоко');
    await user.type(screen.getByLabelText('Кількість'), '1.5');
    await user.selectOptions(screen.getByLabelText('Одиниця'), 'kg');

    await user.click(screen.getByRole('button', { name: 'Створити' }));

    await waitFor(() => {
      expect(mockedCreateIngredient).toHaveBeenCalledTimes(1);
    });
    expect(mockedCreateIngredient).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Молоко',
        trackingMode: 'quantity',
        baseUnit: 'gram',
        quantity: 1500,
      }),
      ADMIN_UID,
    );
  });

  it('hides quantity and low-stock inputs when tracking mode is presence', async () => {
    const user = userEvent.setup();
    emitActive([]);

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Додати інгредієнт' }));
    await user.selectOptions(screen.getByLabelText('Тип обліку'), 'presence');

    expect(screen.queryByLabelText('Кількість')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Поріг низького запасу/)).not.toBeInTheDocument();
  });

  it('rejects a negative quantity without calling the service', async () => {
    const user = userEvent.setup();
    emitActive([]);

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Додати інгредієнт' }));
    await user.type(screen.getByLabelText('Назва'), 'Молоко');
    await user.type(screen.getByLabelText('Кількість'), '-5');

    await user.click(screen.getByRole('button', { name: 'Створити' }));

    expect(await screen.findByText('Введіть коректну кількість (число не менше нуля)')).toBeInTheDocument();
    expect(mockedCreateIngredient).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric quantity without calling the service', async () => {
    const user = userEvent.setup();
    emitActive([]);

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Додати інгредієнт' }));
    await user.type(screen.getByLabelText('Назва'), 'Молоко');
    await user.type(screen.getByLabelText('Кількість'), 'abc');

    await user.click(screen.getByRole('button', { name: 'Створити' }));

    expect(await screen.findByText('Введіть коректну кількість (число не менше нуля)')).toBeInTheDocument();
    expect(mockedCreateIngredient).not.toHaveBeenCalled();
  });

  it('prevents a duplicate submit from double-clicking the create button', async () => {
    const user = userEvent.setup();
    emitActive([]);
    let resolveCreate: (value: string) => void = () => undefined;
    mockedCreateIngredient.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveCreate = resolve;
        }),
    );

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Додати інгредієнт' }));
    await user.type(screen.getByLabelText('Назва'), 'Молоко');
    await user.type(screen.getByLabelText('Кількість'), '1');

    const submitButton = screen.getByRole('button', { name: 'Створити' });
    await user.dblClick(submitButton);

    expect(mockedCreateIngredient).toHaveBeenCalledTimes(1);
    resolveCreate('new-id');
  });
});

describe('InventoryPage edit dialog', () => {
  it('updates the name and low-stock threshold of an existing ingredient', async () => {
    const user = userEvent.setup();
    const ingredient = buildIngredient({ id: 'edit-1', name: 'Борошно', lowStockThreshold: 500 });
    emitActive([ingredient]);
    mockedUpdateIngredient.mockResolvedValue(undefined);

    renderPage();

    const menu = await openCardMenu(user, 'Борошно');
    await user.click(within(menu).getByRole('menuitem', { name: 'Редагувати «Борошно»' }));

    const nameInput = screen.getByLabelText('Назва');
    await user.clear(nameInput);
    await user.type(nameInput, 'Борошно пшеничне');

    const thresholdInput = screen.getByLabelText(/Поріг низького запасу/);
    await user.clear(thresholdInput);
    await user.type(thresholdInput, '750');

    await user.click(screen.getByRole('button', { name: 'Зберегти зміни' }));

    await waitFor(() => {
      expect(mockedUpdateIngredient).toHaveBeenCalledTimes(1);
    });
    expect(mockedUpdateIngredient).toHaveBeenCalledWith(
      'edit-1',
      expect.objectContaining({ name: 'Борошно пшеничне', lowStockThreshold: 750 }),
      ADMIN_UID,
    );
  });
});

describe('InventoryPage archive and restore', () => {
  it('archives only after confirmation and issues no movement service call', async () => {
    const user = userEvent.setup();
    const ingredient = buildIngredient({ id: 'archive-1', name: 'Борошно' });
    emitActive([ingredient]);
    mockedArchiveIngredient.mockResolvedValue(undefined);

    renderPage();

    const menu = await openCardMenu(user, 'Борошно');
    await user.click(within(menu).getByRole('menuitem', { name: 'Архівувати «Борошно»' }));

    expect(mockedArchiveIngredient).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Архівувати' }));

    await waitFor(() => {
      expect(mockedArchiveIngredient).toHaveBeenCalledWith('archive-1', ADMIN_UID);
    });
    expect(mockedSubscribeMovements).not.toHaveBeenCalled();
  });

  it('restores an archived ingredient from the archived tab without confirmation', async () => {
    const user = userEvent.setup();
    mockedSubscribeActive.mockReturnValue(vi.fn());
    const ingredient = buildIngredient({ id: 'restore-1', name: 'Сіль', archivedAt: { toMillis: () => 1 } as never });
    emitArchived([ingredient]);
    mockedRestoreIngredient.mockResolvedValue(undefined);

    const user2 = user;
    renderPage();

    await user2.click(screen.getByRole('tab', { name: 'Архівні' }));
    const menu = await openCardMenu(user2, 'Сіль');
    await user2.click(within(menu).getByRole('menuitem', { name: 'Відновити «Сіль»' }));

    await waitFor(() => {
      expect(mockedRestoreIngredient).toHaveBeenCalledWith('restore-1', ADMIN_UID);
    });
  });
});

describe('InventoryPage stock/presence action availability', () => {
  it('shows restock and correction actions (and not presence actions) for a quantity ingredient', async () => {
    const user = userEvent.setup();
    emitActive([buildIngredient({ id: 'q-1', name: 'Борошно', trackingMode: 'quantity', baseUnit: 'gram' })]);

    renderPage();
    const menu = await openCardMenu(user, 'Борошно');

    expect(within(menu).getByRole('menuitem', { name: 'Поповнити «Борошно»' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Скоригувати «Борошно»' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Позначити наявним «Борошно»' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Позначити відсутнім «Борошно»' })).not.toBeInTheDocument();
  });

  it('shows mark-present and mark-absent actions (and not restock/correction) for a presence ingredient', async () => {
    const user = userEvent.setup();
    emitActive([
      buildIngredient({
        id: 'p-1',
        name: 'Сіль',
        trackingMode: 'presence',
        baseUnit: 'presence',
        quantity: null,
        isPresent: true,
      }),
    ]);

    renderPage();
    const menu = await openCardMenu(user, 'Сіль');

    expect(within(menu).getByRole('menuitem', { name: 'Позначити наявним «Сіль»' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Позначити відсутнім «Сіль»' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Поповнити «Сіль»' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Скоригувати «Сіль»' })).not.toBeInTheDocument();
  });
});

describe('InventoryPage restock dialog', () => {
  it('accepts an amount and unit and calls restockIngredient with the canonical delta', async () => {
    const user = userEvent.setup();
    emitActive([buildIngredient({ id: 'q-1', name: 'Борошно', trackingMode: 'quantity', baseUnit: 'gram' })]);

    renderPage();

    const cardMenu = await openCardMenu(user, 'Борошно');
    await user.click(within(cardMenu).getByRole('menuitem', { name: 'Поповнити «Борошно»' }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Кількість'), '1.5');
    await user.selectOptions(within(dialog).getByLabelText('Одиниця'), 'kg');
    await user.click(within(dialog).getByRole('button', { name: 'Поповнити' }));

    await waitFor(() => {
      expect(mockedRestockIngredient).toHaveBeenCalledTimes(1);
    });
    expect(mockedRestockIngredient).toHaveBeenCalledWith('q-1', 1500, ADMIN_UID);
  });

  it('prevents a duplicate submit from double-clicking the restock button', async () => {
    const user = userEvent.setup();
    emitActive([buildIngredient({ id: 'q-1', name: 'Борошно', trackingMode: 'quantity', baseUnit: 'gram' })]);
    let resolveRestock: () => void = () => undefined;
    mockedRestockIngredient.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRestock = () => {
            resolve(undefined);
          };
        }),
    );

    renderPage();

    const cardMenu = await openCardMenu(user, 'Борошно');
    await user.click(within(cardMenu).getByRole('menuitem', { name: 'Поповнити «Борошно»' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Кількість'), '1');

    const submitButton = within(dialog).getByRole('button', { name: 'Поповнити' });
    await user.dblClick(submitButton);

    expect(mockedRestockIngredient).toHaveBeenCalledTimes(1);
    resolveRestock();
  });
});

describe('InventoryPage correction dialog', () => {
  it('blocks submit and shows a localized error when the reason is empty', async () => {
    const user = userEvent.setup();
    emitActive([buildIngredient({ id: 'q-1', name: 'Борошно', trackingMode: 'quantity', baseUnit: 'gram' })]);

    renderPage();

    const cardMenu = await openCardMenu(user, 'Борошно');
    await user.click(within(cardMenu).getByRole('menuitem', { name: 'Скоригувати «Борошно»' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Фактична кількість'), '1.5');
    await user.click(within(dialog).getByRole('button', { name: 'Зберегти коригування' }));

    expect(await within(dialog).findByText('Вкажіть причину коригування')).toBeInTheDocument();
    expect(mockedCorrectIngredientQuantity).not.toHaveBeenCalled();
  });

  it('submits the exact balance and reason once provided', async () => {
    const user = userEvent.setup();
    emitActive([buildIngredient({ id: 'q-1', name: 'Борошно', trackingMode: 'quantity', baseUnit: 'gram' })]);

    renderPage();

    const cardMenu = await openCardMenu(user, 'Борошно');
    await user.click(within(cardMenu).getByRole('menuitem', { name: 'Скоригувати «Борошно»' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Фактична кількість'), '1.5');
    await user.selectOptions(within(dialog).getByLabelText('Одиниця'), 'kg');
    await user.type(within(dialog).getByLabelText('Причина коригування'), 'Звірка залишків');
    await user.click(within(dialog).getByRole('button', { name: 'Зберегти коригування' }));

    await waitFor(() => {
      expect(mockedCorrectIngredientQuantity).toHaveBeenCalledTimes(1);
    });
    expect(mockedCorrectIngredientQuantity).toHaveBeenCalledWith('q-1', 1500, 'Звірка залишків', ADMIN_UID);
  });
});

describe('InventoryPage presence actions', () => {
  it('marks absent immediately with no dialog and no extra input', async () => {
    const user = userEvent.setup();
    emitActive([
      buildIngredient({
        id: 'p-1',
        name: 'Сіль',
        trackingMode: 'presence',
        baseUnit: 'presence',
        quantity: null,
        isPresent: true,
      }),
    ]);

    renderPage();

    const cardMenu = await openCardMenu(user, 'Сіль');
    await user.click(within(cardMenu).getByRole('menuitem', { name: 'Позначити відсутнім «Сіль»' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockedMarkIngredientAbsent).toHaveBeenCalledWith('p-1', ADMIN_UID);
    });
  });

  it('marks present immediately with no dialog', async () => {
    const user = userEvent.setup();
    emitActive([
      buildIngredient({
        id: 'p-1',
        name: 'Сіль',
        trackingMode: 'presence',
        baseUnit: 'presence',
        quantity: null,
        isPresent: false,
      }),
    ]);

    renderPage();

    const cardMenu = await openCardMenu(user, 'Сіль');
    await user.click(within(cardMenu).getByRole('menuitem', { name: 'Позначити наявним «Сіль»' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockedMarkIngredientPresent).toHaveBeenCalledWith('p-1', ADMIN_UID);
    });
  });
});

describe('InventoryPage low-stock indicator', () => {
  it('shows an accessible text label when quantity is at or below the threshold', () => {
    const ingredient = buildIngredient({ id: 'low-1', name: 'Олія', quantity: 400, lowStockThreshold: 500 });
    emitActive([ingredient]);

    renderPage();

    expect(screen.getByText('Низький запас')).toBeInTheDocument();
  });

  it('does not show the low-stock label when quantity is above the threshold', () => {
    const ingredient = buildIngredient({ id: 'ok-1', name: 'Олія', quantity: 900, lowStockThreshold: 500 });
    emitActive([ingredient]);

    renderPage();

    expect(screen.queryByText('Низький запас')).not.toBeInTheDocument();
  });
});
