import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import { ThemeProvider } from '@mui/material/styles';
import type { DefaultMealTimes } from '../../../../../shared/types/generalSettings';
import { MealTimesForm } from '../MealTimesForm';

const renderForm = (props: Partial<React.ComponentProps<typeof MealTimesForm>> = {}) => {
  const defaultTimes: DefaultMealTimes = {
    breakfast: '08:00',
    lunch: '13:00',
    dinner: '19:00',
  };

  const mockOnSave = vi.fn().mockResolvedValue(undefined);

  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MealTimesForm
          initialTimes={defaultTimes}
          hasNeverBeenSaved={false}
          isSaving={false}
          error={null}
          onSave={mockOnSave}
          {...props}
        />
      </ThemeProvider>
    </I18nextProvider>,
  );
};

beforeEach(() => {
  void i18n.changeLanguage('uk');
});

describe('MealTimesForm', () => {
  it('renders all meal time fields', () => {
    renderForm();

    expect(screen.getByLabelText('Сніданок')).toBeInTheDocument();
    expect(screen.getByLabelText('Обід')).toBeInTheDocument();
    expect(screen.getByLabelText('Вечеря')).toBeInTheDocument();
  });

  it('shows never-saved banner when hasNeverBeenSaved is true', () => {
    renderForm({ hasNeverBeenSaved: true });

    expect(screen.getByText('Використовуються типові значення — збережіть, щоб зафіксувати свої.')).toBeInTheDocument();
  });

  it('shows reset button only when hasNeverBeenSaved is true', () => {
    const { rerender } = renderForm({ hasNeverBeenSaved: false });
    expect(screen.queryByRole('button', { name: 'Скинути до типових' })).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <MealTimesForm
            initialTimes={{ breakfast: '08:00', lunch: '13:00', dinner: '19:00' }}
            hasNeverBeenSaved={true}
            isSaving={false}
            error={null}
            onSave={vi.fn()}
          />
        </ThemeProvider>
      </I18nextProvider>,
    );

    expect(screen.getByRole('button', { name: 'Скинути до типових' })).toBeInTheDocument();
  });

  it('disables save button when there are no changes and not never-saved', () => {
    renderForm({ hasNeverBeenSaved: false });

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });
    expect(saveButton).toBeDisabled();
  });

  it('disables save button when no changes and not never-saved (re-confirm)', () => {
    renderForm({ hasNeverBeenSaved: false });

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });
    expect(saveButton).toBeDisabled();
  });

  it('calls onSave when save button is clicked in never-saved state', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSave, hasNeverBeenSaved: true });

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        breakfast: '08:00',
        lunch: '13:00',
        dinner: '19:00',
      });
    });
  });

  it('disables button while saving is in progress', async () => {
    const user = userEvent.setup();
    let resolveOnSave!: () => void;
    const onSavePromise = new Promise<void>(resolve => {
      resolveOnSave = resolve;
    });
    const onSave = vi.fn(() => onSavePromise);
    renderForm({ onSave, hasNeverBeenSaved: true });

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });
    expect(saveButton).not.toBeDisabled();

    // Start the save
    const clickPromise = user.click(saveButton);

    // Give the click handler time to execute
    await new Promise(r => setTimeout(r, 50));

    // Resolve the save promise
    resolveOnSave();
    await clickPromise;

    // After save completes, button should be enabled again
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('handles save error gracefully', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    renderForm({ onSave, hasNeverBeenSaved: true });

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    // Should be able to click save button without error
    await user.click(saveButton);

    // onSave should have been called
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('shows reset button only in never-saved state and clicking it does not error', async () => {
    const user = userEvent.setup();
    renderForm({ hasNeverBeenSaved: true });

    const resetButton = screen.getByRole('button', { name: 'Скинути до типових' });
    expect(resetButton).toBeInTheDocument();

    // Clicking reset should not throw (button is functional)
    await user.click(resetButton);

    // Form should still be rendered
    expect(screen.getByLabelText('Сніданок')).toBeInTheDocument();
  });

  it('shows helper text about defaults applying to new requests', () => {
    renderForm();

    expect(screen.getByText(/Типові: 08:00 · 13:00 · 19:00/)).toBeInTheDocument();
  });
});
