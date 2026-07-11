import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';

import { i18n } from '../../../app/i18n';
import { theme } from '../../../app/theme';
import type { DishWithId } from '../../../shared/types/dish';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { UserProfile } from '../../../shared/types/userProfile';

vi.mock('../../../infrastructure/firebase/services/dishService', () => ({
  subscribeActiveDishes: vi.fn(),
  subscribeArchivedDishes: vi.fn(),
  createDish: vi.fn(),
  updateDish: vi.fn(),
  archiveDish: vi.fn(),
  restoreDish: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeActiveIngredients: vi.fn(),
  subscribeArchivedIngredients: vi.fn(),
}));

vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

import {
  archiveDish,
  createDish,
  restoreDish,
  subscribeActiveDishes,
  subscribeArchivedDishes,
  updateDish,
} from '../../../infrastructure/firebase/services/dishService';
import { subscribeActiveIngredients } from '../../../infrastructure/firebase/services/ingredientService';
import { useAuth } from '../../auth/useAuth';
import { DishesPage } from '../pages/DishesPage';

const mockedSubscribeActive = vi.mocked(subscribeActiveDishes);
const mockedSubscribeArchived = vi.mocked(subscribeArchivedDishes);
const mockedCreateDish = vi.mocked(createDish);
const mockedUpdateDish = vi.mocked(updateDish);
const mockedArchiveDish = vi.mocked(archiveDish);
const mockedRestoreDish = vi.mocked(restoreDish);
const mockedSubscribeActiveIngredients = vi.mocked(subscribeActiveIngredients);
const mockedUseAuth = vi.mocked(useAuth);

const ADMIN_UID = 'test-admin-uid';

const now = { toMillis: () => 0 } as never;

const buildDish = (overrides: Partial<DishWithId> = {}): DishWithId => ({
  id: 'dish-1',
  name: 'Грибне різото',
  description: '',
  mealTypes: ['lunch'],
  recipeItems: [{ ingredientId: 'ingredient-1', ingredientName: 'Рис', requiredQuantity: 300, requiresPresence: null }],
  archivedAt: null,
  createdAt: now,
  createdBy: ADMIN_UID,
  updatedAt: now,
  updatedBy: ADMIN_UID,
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
  createdBy: ADMIN_UID,
  updatedAt: now,
  updatedBy: ADMIN_UID,
  ...overrides,
});

const renderPage = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <DishesPage />
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>,
  );

const emitActive = (dishes: DishWithId[]) => {
  mockedSubscribeActive.mockImplementation((onNext): Unsubscribe => {
    onNext(dishes);
    return vi.fn();
  });
};

const emitArchived = (dishes: DishWithId[]) => {
  mockedSubscribeArchived.mockImplementation((onNext): Unsubscribe => {
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
  mockedSubscribeActiveIngredients.mockReturnValue(vi.fn());
  mockedCreateDish.mockResolvedValue('new-dish-id');
  mockedUpdateDish.mockResolvedValue(undefined);
  mockedArchiveDish.mockResolvedValue(undefined);
  mockedRestoreDish.mockResolvedValue(undefined);
});

describe('DishesPage data states', () => {
  it('shows a loading state before the active subscription emits', () => {
    renderPage();

    expect(screen.getByText('Завантаження…')).toBeInTheDocument();
  });

  it('shows an error state (with retry) when the active subscription fails', async () => {
    const user = userEvent.setup();
    let failNext = () => {
      // no-op until assigned below
    };
    mockedSubscribeActive.mockImplementation((_onNext, onError): Unsubscribe => {
      failNext = () => {
        onError(new Error('boom'));
      };
      failNext();
      return vi.fn();
    });
    emitIngredients([]);

    renderPage();

    expect(screen.getByText('Не вдалося завантажити')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'Повторити' });

    await user.click(retryButton);
    expect(mockedSubscribeActive).toHaveBeenCalledTimes(2);
  });

  it('shows an empty state when there are no active dishes', () => {
    emitActive([]);
    emitIngredients([]);

    renderPage();

    expect(screen.getByText('Ще немає страв')).toBeInTheDocument();
    expect(
      screen.getByText("Додайте першу страву з рецептом — і вона з'явиться в меню, щойно будуть інгредієнти."),
    ).toBeInTheDocument();
  });

  it('opens the create-dish form from the empty-state CTA', async () => {
    const user = userEvent.setup();
    emitActive([]);
    emitIngredients([]);

    renderPage();

    const ctaButtons = screen.getAllByRole('button', { name: '+ Додати страву' });
    await user.click(ctaButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Нова страва')).toBeInTheDocument();
  });

  it('renders the populated list with a status chip per dish', () => {
    emitActive([buildDish()]);
    emitIngredients([buildIngredient()]);

    renderPage();

    expect(screen.getByText('Грибне різото')).toBeInTheDocument();
    expect(screen.getByText('Можна приготувати')).toBeInTheDocument();
  });

  it('pluralizes the ingredient-count meta line per Ukrainian plural rules', () => {
    const buildRecipeItems = (count: number) =>
      Array.from({ length: count }, (_unused, index) => ({
        ingredientId: `ingredient-${String(index)}`,
        ingredientName: `Інгредієнт ${String(index)}`,
        requiredQuantity: 100,
        requiresPresence: null,
      }));

    emitActive([
      buildDish({ id: 'dish-1', recipeItems: buildRecipeItems(1) }),
      buildDish({ id: 'dish-2', recipeItems: buildRecipeItems(2) }),
      buildDish({ id: 'dish-5', recipeItems: buildRecipeItems(5) }),
    ]);
    emitIngredients(
      Array.from({ length: 5 }, (_unused, index) =>
        buildIngredient({ id: `ingredient-${String(index)}`, name: `Інгредієнт ${String(index)}` }),
      ),
    );

    renderPage();

    expect(screen.getByText('1 інгредієнт')).toBeInTheDocument();
    expect(screen.getByText('2 інгредієнти')).toBeInTheDocument();
    expect(screen.getByText('5 інгредієнтів')).toBeInTheDocument();
  });

  it('shows the not-configured chip and single configure action for a dish with an empty recipe', () => {
    emitActive([buildDish({ recipeItems: [] })]);
    emitIngredients([]);

    renderPage();

    expect(screen.getByText('Не налаштовано')).toBeInTheDocument();
    expect(screen.getByText("Рецепт порожній — страва не з'являється в меню")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Налаштувати рецепт' })).toBeInTheDocument();
  });
});

describe('DishesPage tabs', () => {
  it('unsubscribes the active feed and subscribes archived when switching tabs', async () => {
    const user = userEvent.setup();
    const unsubscribeActive = vi.fn();
    mockedSubscribeActive.mockImplementation((onNext): Unsubscribe => {
      onNext([buildDish()]);
      return unsubscribeActive;
    });
    emitArchived([]);
    emitIngredients([]);

    renderPage();
    expect(mockedSubscribeActive).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('tab', { name: 'Архів' }));

    await waitFor(() => {
      expect(mockedSubscribeArchived).toHaveBeenCalledTimes(1);
    });
    expect(unsubscribeActive).toHaveBeenCalledTimes(1);
  });

  it('shows a Restore action instead of Edit/Archive on the archived tab', async () => {
    const user = userEvent.setup();
    emitActive([]);
    emitArchived([buildDish({ id: 'archived-1', archivedAt: now })]);
    emitIngredients([]);

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Архів' }));

    const restoreButton = await screen.findByRole('button', { name: 'Відновити' });
    await user.click(restoreButton);

    await waitFor(() => {
      expect(mockedRestoreDish).toHaveBeenCalledWith('archived-1', ADMIN_UID);
    });
  });
});

describe('DishesPage create dialog', () => {
  it('creates a dish with a name and at least one meal type', async () => {
    const user = userEvent.setup();
    emitActive([]);
    emitIngredients([buildIngredient()]);

    renderPage();

    await user.click(screen.getAllByRole('button', { name: '+ Додати страву' })[0]);
    await user.type(screen.getByLabelText('Назва *'), 'Млинці');
    await user.click(screen.getByRole('button', { name: 'Сніданок' }));
    await user.click(screen.getByRole('button', { name: 'Зберегти страву' }));

    await waitFor(() => {
      expect(mockedCreateDish).toHaveBeenCalledTimes(1);
    });
    expect(mockedCreateDish).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Млинці', mealTypes: ['breakfast'], recipeItems: [] }),
      ADMIN_UID,
    );
  });

  it('keeps the submit button disabled with no name (empty name is invalid)', async () => {
    const user = userEvent.setup();
    emitActive([]);
    emitIngredients([]);

    renderPage();

    await user.click(screen.getAllByRole('button', { name: '+ Додати страву' })[0]);
    await user.click(screen.getByRole('button', { name: 'Сніданок' }));

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).toBeDisabled();
    expect(mockedCreateDish).not.toHaveBeenCalled();
  });

  it('keeps the submit button disabled with no meal type selected', async () => {
    const user = userEvent.setup();
    emitActive([]);
    emitIngredients([]);

    renderPage();

    await user.click(screen.getAllByRole('button', { name: '+ Додати страву' })[0]);
    await user.type(screen.getByLabelText('Назва *'), 'Млинці');

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).toBeDisabled();
    expect(mockedCreateDish).not.toHaveBeenCalled();
  });

  it('keeps the submit button disabled while an added recipe row has no quantity', async () => {
    const user = userEvent.setup();
    emitActive([]);
    emitIngredients([buildIngredient()]);

    renderPage();

    await user.click(screen.getAllByRole('button', { name: '+ Додати страву' })[0]);
    await user.type(screen.getByLabelText('Назва *'), 'Млинці');
    await user.click(screen.getByRole('button', { name: 'Сніданок' }));
    await user.click(screen.getByRole('button', { name: '+ Додати інгредієнт' }));

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).toBeDisabled();
    expect(mockedCreateDish).not.toHaveBeenCalled();
  });

  it('enables the submit button once name, meal type, and recipe rows are all valid', async () => {
    const user = userEvent.setup();
    emitActive([]);
    emitIngredients([]);

    renderPage();

    await user.click(screen.getAllByRole('button', { name: '+ Додати страву' })[0]);
    const saveButton = screen.getByRole('button', { name: 'Зберегти страву' });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Назва *'), 'Млинці');
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Сніданок' }));
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);

    await waitFor(() => {
      expect(mockedCreateDish).toHaveBeenCalledTimes(1);
    });
  });
});

describe('DishesPage edit dialog', () => {
  it('updates a dish name', async () => {
    const user = userEvent.setup();
    const dish = buildDish({ id: 'edit-1' });
    emitActive([dish]);
    emitIngredients([buildIngredient()]);

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Редагувати' }));
    const nameInput = screen.getByLabelText('Назва *');
    await user.clear(nameInput);
    await user.type(nameInput, 'Грибне різото (оновлено)');
    await user.click(screen.getByRole('button', { name: 'Зберегти страву' }));

    await waitFor(() => {
      expect(mockedUpdateDish).toHaveBeenCalledTimes(1);
    });
    expect(mockedUpdateDish).toHaveBeenCalledWith(
      'edit-1',
      expect.objectContaining({ name: 'Грибне різото (оновлено)' }),
      ADMIN_UID,
    );
  });
});

describe('DishesPage archive flow', () => {
  it('archives only after confirming the dialog', async () => {
    const user = userEvent.setup();
    const dish = buildDish({ id: 'archive-1' });
    emitActive([dish]);
    emitIngredients([buildIngredient()]);

    renderPage();

    await user.click(screen.getByRole('button', { name: 'В архів' }));
    expect(mockedArchiveDish).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'В архів' }));

    await waitFor(() => {
      expect(mockedArchiveDish).toHaveBeenCalledWith('archive-1', ADMIN_UID);
    });
  });
});
