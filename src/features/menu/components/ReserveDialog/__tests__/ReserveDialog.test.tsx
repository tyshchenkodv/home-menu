import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import { BatchDomainError } from '../../../../../domain/batches/errors';
import { ReserveDialog } from '../ReserveDialog';

const renderDialog = (overrides: Partial<React.ComponentProps<typeof ReserveDialog>> = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <ReserveDialog
          open
          dishName="Грибне різото"
          availableQuantity={4}
          mealType="lunch"
          dateLabel="Ср, 9"
          onCancel={vi.fn()}
          onConfirm={vi.fn().mockResolvedValue(undefined)}
          {...overrides}
        />
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  void i18n.changeLanguage('uk');
});

describe('ReserveDialog', () => {
  it('includes the date in the subtitle', () => {
    renderDialog();

    expect(screen.getByText('Грибне різото · Ср, 9 · вільно 4 порції')).toBeInTheDocument();
  });

  it('renders the meal-category tag chip next to the title', () => {
    renderDialog({ mealType: 'lunch' });

    expect(screen.getByText('Обід')).toBeInTheDocument();
  });

  it('shows the "N of M left" helper', () => {
    renderDialog({ availableQuantity: 4 });

    expect(screen.getByText('1 з 4')).toBeInTheDocument();
  });

  it('renders the failure state with mascot, headline, interpolated body, and a refresh CTA on reservation error', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new BatchDomainError('batch/insufficient-available'));
    renderDialog({ onConfirm, availableQuantity: 2 });

    await user.click(screen.getByRole('button', { name: 'Зарезервувати' }));

    expect(await screen.findByText('Не вдалося зарезервувати')).toBeInTheDocument();
    expect(screen.getByText('Хтось випередив — залишилась 2 порція з 1 потрібних.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Оновити наявність' })).toBeInTheDocument();

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
