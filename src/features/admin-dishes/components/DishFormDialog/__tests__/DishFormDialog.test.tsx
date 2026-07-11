import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { IngredientWithId } from '../../../../../shared/types/ingredient';
import type { DishFormInitialValues } from '../../../types/dishFormInitialValues';
import type { DishFormSubmitPayload } from '../../../types/dishFormSubmitPayload';
import { createEmptyRecipeRow } from '../../../types/recipeRowValue';
import { DishFormDialog } from '../DishFormDialog';

const now = { toMillis: () => 0 } as never;

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
  createdBy: 'admin-1',
  updatedAt: now,
  updatedBy: 'admin-1',
  ...overrides,
});

const emptyInitialValues: DishFormInitialValues = {
  name: '',
  description: '',
  mealTypes: [],
  recipeRows: [],
};

const renderDialog = (overrides: Partial<React.ComponentProps<typeof DishFormDialog>> = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <DishFormDialog
          open
          mode="create"
          initialValues={emptyInitialValues}
          availableIngredients={[buildIngredient()]}
          onCancel={vi.fn()}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          {...overrides}
        />
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  void i18n.changeLanguage('uk');
});

describe('DishFormDialog submit button validity', () => {
  it('is disabled when the name is empty', () => {
    renderDialog({
      initialValues: { ...emptyInitialValues, mealTypes: ['breakfast'] },
    });

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).toBeDisabled();
  });

  it('is disabled when no meal type is selected', () => {
    renderDialog({
      initialValues: { ...emptyInitialValues, name: 'Млинці' },
    });

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).toBeDisabled();
  });

  it('is disabled when a present recipe row has no ingredient chosen', () => {
    renderDialog({
      initialValues: {
        ...emptyInitialValues,
        name: 'Млинці',
        mealTypes: ['breakfast'],
        recipeRows: [createEmptyRecipeRow('row-1')],
      },
    });

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).toBeDisabled();
  });

  it('is disabled when a present recipe row has quantity <= 0', () => {
    renderDialog({
      initialValues: {
        ...emptyInitialValues,
        name: 'Млинці',
        mealTypes: ['breakfast'],
        recipeRows: [{ key: 'row-1', ingredientId: 'ingredient-1', quantityText: '0', inputUnit: 'g' }],
      },
    });

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).toBeDisabled();
  });

  it('is enabled once name, meal type, and every present recipe row are valid', () => {
    renderDialog({
      initialValues: {
        ...emptyInitialValues,
        name: 'Млинці',
        mealTypes: ['breakfast'],
        recipeRows: [{ key: 'row-1', ingredientId: 'ingredient-1', quantityText: '300', inputUnit: 'g' }],
      },
    });

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).not.toBeDisabled();
  });

  it('is enabled with no recipe rows at all (empty recipe is valid, "not configured")', () => {
    renderDialog({
      initialValues: { ...emptyInitialValues, name: 'Млинці', mealTypes: ['breakfast'] },
    });

    expect(screen.getByRole('button', { name: 'Зберегти страву' })).not.toBeDisabled();
  });

  it('submits the payload when clicked while valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(payload: DishFormSubmitPayload) => Promise<void>>(() => Promise.resolve());
    renderDialog({
      initialValues: { ...emptyInitialValues, name: 'Млинці', mealTypes: ['breakfast'] },
      onSubmit,
    });

    await user.click(screen.getByRole('button', { name: 'Зберегти страву' }));

    expect(onSubmit).toHaveBeenCalledWith({
      mode: 'create',
      input: { name: 'Млинці', description: '', mealTypes: ['breakfast'], recipeItems: [] },
    });
  });

  it('becomes disabled again if a valid form is edited back into an invalid state', async () => {
    const user = userEvent.setup();
    renderDialog({
      initialValues: { ...emptyInitialValues, name: 'Млинці', mealTypes: ['breakfast'] },
    });

    const saveButton = screen.getByRole('button', { name: 'Зберегти страву' });
    expect(saveButton).not.toBeDisabled();

    await user.clear(screen.getByLabelText('Назва *'));
    expect(saveButton).toBeDisabled();
  });
});
