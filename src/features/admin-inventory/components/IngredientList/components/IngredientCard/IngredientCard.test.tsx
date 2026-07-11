import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../../app/i18n';
import type { IngredientWithId } from '../../../../../../shared/types/ingredient';
import { IngredientCard } from './IngredientCard';

const baseIngredient: IngredientWithId = {
  id: 'ingredient-1',
  name: 'Flour',
  trackingMode: 'quantity',
  baseUnit: 'gram',
  quantity: 500,
  isPresent: null,
  lowStockThreshold: null,
  archivedAt: null,
  createdAt: { toMillis: () => 0 } as never,
  createdBy: 'test-user',
  updatedAt: { toMillis: () => 0 } as never,
  updatedBy: 'test-user',
};

const renderCard = (props: Partial<React.ComponentProps<typeof IngredientCard>> = {}) => {
  const handlers = {
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn(),
    onRestock: vi.fn(),
    onCorrect: vi.fn(),
    onMarkPresent: vi.fn(),
    onMarkAbsent: vi.fn(),
  };

  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <IngredientCard ingredient={baseIngredient} tab="active" {...handlers} {...props} />
      </MemoryRouter>
    </I18nextProvider>,
  );

  return handlers;
};

describe('IngredientCard', () => {
  it('renders a status chip for the ingredient', () => {
    renderCard();

    expect(screen.getByText('Є')).toBeInTheDocument();
  });

  it('renders a low-stock status chip when the ingredient is low on stock', () => {
    renderCard({
      ingredient: { ...baseIngredient, quantity: 1, lowStockThreshold: 5 },
    });

    expect(screen.getByText('Мало')).toBeInTheDocument();
  });

  it('shows the zero-quantity "ran out" copy instead of a plain amount when quantity is 0', () => {
    renderCard({
      ingredient: { ...baseIngredient, quantity: 0 },
    });

    expect(screen.getByText('0 г — закінчилися')).toBeInTheDocument();
    expect(screen.queryByText('0 г')).not.toBeInTheDocument();
  });

  it('does not render inline action buttons', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: /^Редагувати «/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Поповнити «/ })).not.toBeInTheDocument();
  });

  it('opens a menu with quantity actions on the active tab', async () => {
    const user = userEvent.setup();
    const handlers = renderCard();

    await user.click(screen.getByRole('button', { name: 'Більше дій для «Flour»' }));
    const menu = screen.getByRole('menu');

    expect(within(menu).getByRole('menuitem', { name: 'Історія для «Flour»' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Редагувати «Flour»' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Поповнити «Flour»' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Скоригувати «Flour»' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Позначити наявним «Flour»' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Позначити відсутнім «Flour»' })).not.toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Архівувати «Flour»' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Відновити «Flour»' })).not.toBeInTheDocument();

    await user.click(within(menu).getByRole('menuitem', { name: 'Поповнити «Flour»' }));
    expect(handlers.onRestock).toHaveBeenCalledWith(baseIngredient);
  });

  it('opens a menu with presence actions for a presence ingredient', async () => {
    const user = userEvent.setup();
    const handlers = renderCard({
      ingredient: {
        ...baseIngredient,
        trackingMode: 'presence',
        baseUnit: 'presence',
        quantity: null,
        isPresent: true,
      },
    });

    await user.click(screen.getByRole('button', { name: 'Більше дій для «Flour»' }));
    const menu = screen.getByRole('menu');

    expect(within(menu).getByRole('menuitem', { name: 'Позначити наявним «Flour»' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Позначити відсутнім «Flour»' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Поповнити «Flour»' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Скоригувати «Flour»' })).not.toBeInTheDocument();

    await user.click(within(menu).getByRole('menuitem', { name: 'Позначити відсутнім «Flour»' }));
    expect(handlers.onMarkAbsent).toHaveBeenCalledWith(expect.objectContaining({ id: 'ingredient-1' }));
  });

  it('shows a restore action instead of archive on the archived tab', async () => {
    const user = userEvent.setup();
    const handlers = renderCard({ tab: 'archived' });

    await user.click(screen.getByRole('button', { name: 'Більше дій для «Flour»' }));
    const menu = screen.getByRole('menu');

    expect(within(menu).getByRole('menuitem', { name: 'Відновити «Flour»' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Архівувати «Flour»' })).not.toBeInTheDocument();

    await user.click(within(menu).getByRole('menuitem', { name: 'Відновити «Flour»' }));
    expect(handlers.onRestore).toHaveBeenCalledWith(baseIngredient);
  });
});
