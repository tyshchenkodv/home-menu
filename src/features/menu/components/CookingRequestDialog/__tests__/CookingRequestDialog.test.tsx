import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { CalendarDate } from '../../../../../domain/orders/types';
import { formatCalendarDateLabel } from '../../../utils/formatCalendarDate';
import { CookingRequestDialog } from '../CookingRequestDialog';

const DATE: CalendarDate = { year: 2026, month: 7, day: 13 };

const renderDialog = (overrides: Partial<React.ComponentProps<typeof CookingRequestDialog>> = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CookingRequestDialog
          open
          dishName="Грибне різото"
          date={DATE}
          mealType="lunch"
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

describe('CookingRequestDialog', () => {
  it('renders the read-only date + meal context line next to the dish name', () => {
    renderDialog();

    expect(screen.getByText('Грибне різото')).toBeInTheDocument();
    const expectedLabel = `${formatCalendarDateLabel(DATE, 'uk')} · Обід`;
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('renders the context line in English when the locale is English', async () => {
    await i18n.changeLanguage('en');
    renderDialog();

    const expectedLabel = `${formatCalendarDateLabel(DATE, 'en')} · Lunch`;
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('does not expose the date or meal as editable fields (dialog is dish/context-bound)', () => {
    renderDialog();

    expect(screen.queryByRole('textbox', { name: /date|дата/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /meal|прийом/i })).not.toBeInTheDocument();
  });

  it('submits the entered quantity via onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onConfirm });

    await user.click(screen.getByRole('button', { name: 'Надіслати запит' }));

    expect(onConfirm).toHaveBeenCalledWith(1);
  });
});
