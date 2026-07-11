import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { DishAvailability } from '../../../../../domain/dishes/types';
import type { DishWithId } from '../../../../../shared/types/dish';
import type { MenuDishView } from '../../../types/menuDishView';
import { DishAvailabilityCard } from '../DishAvailabilityCard';

const now = { toMillis: () => 0 } as never;

const buildDish = (overrides: Partial<DishWithId> = {}): DishWithId => ({
  id: 'dish-risotto',
  name: 'Грибне різото',
  description: '',
  mealTypes: ['breakfast'],
  recipeItems: [],
  archivedAt: null,
  createdAt: now,
  createdBy: 'uid',
  updatedAt: now,
  updatedBy: 'uid',
  ...overrides,
});

const buildAvailability = (overrides: Partial<DishAvailability> = {}): DishAvailability => ({
  configured: true,
  readyQuantity: 4,
  canCook: false,
  missingIngredients: [],
  ...overrides,
});

const renderCard = (view: MenuDishView, overrides: { reservedQuantity?: number; requestedQuantity?: number } = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <DishAvailabilityCard view={view} onReserve={vi.fn()} onRequestCooking={vi.fn()} {...overrides} />
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  void i18n.changeLanguage('uk');
});

describe('DishAvailabilityCard', () => {
  it('renders the singular ready-count form for a count of 1', () => {
    renderCard({ dish: buildDish(), availability: buildAvailability({ readyQuantity: 1 }) });

    expect(screen.getByText('1 вільно')).toBeInTheDocument();
  });

  it('renders the plural ready-count form for a count of 4', () => {
    renderCard({ dish: buildDish(), availability: buildAvailability({ readyQuantity: 4 }) });

    expect(screen.getByText('4 вільно')).toBeInTheDocument();
  });

  it('never shrinks the availability chip against a clamped long title', () => {
    renderCard({
      dish: buildDish({ name: 'Дуже-дуже-дуже довга назва страви, яка не має вміщатись в один рядок картки' }),
      availability: buildAvailability(),
    });

    const chip = screen.getByText('Готово зараз').closest('.MuiChip-root');
    const wrapper = chip?.parentElement;
    expect(wrapper).toHaveStyle({ flex: 'none' });
  });

  it('shows the already-reserved hint line when reservedQuantity is greater than 0', () => {
    renderCard({ dish: buildDish(), availability: buildAvailability() }, { reservedQuantity: 2 });

    expect(screen.getByText('Вже зарезервовано: 2')).toBeInTheDocument();
  });

  it('shows the cooking-requested hint line when requestedQuantity is greater than 0', () => {
    renderCard({ dish: buildDish(), availability: buildAvailability() }, { requestedQuantity: 3 });

    expect(screen.getByText('Запит на готування: 3')).toBeInTheDocument();
  });

  it('hides both hint lines when reservedQuantity and requestedQuantity are 0 or undefined', () => {
    renderCard({ dish: buildDish(), availability: buildAvailability() });

    expect(screen.queryByText(/Вже зарезервовано/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Запит на готування/)).not.toBeInTheDocument();
  });

  it('keeps the ready counter and Reserve action unchanged when hints are shown', () => {
    renderCard(
      { dish: buildDish(), availability: buildAvailability({ readyQuantity: 4 }) },
      { reservedQuantity: 2, requestedQuantity: 1 },
    );

    expect(screen.getByText('4 вільно')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зарезервувати' })).toBeInTheDocument();
  });
});
