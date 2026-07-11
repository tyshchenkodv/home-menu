import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import type { CalendarDateOption } from '../../../types/calendarDateOption';
import { DateMealSelector } from '../DateMealSelector';

const OPTIONS: CalendarDateOption[] = [{ date: { year: 2026, month: 7, day: 11 }, key: '2026-07-11' }];

const renderSelector = (overrides: Partial<React.ComponentProps<typeof DateMealSelector>> = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <DateMealSelector
          options={OPTIONS}
          selectedDateKey="2026-07-11"
          onSelectDate={vi.fn()}
          mealType="lunch"
          onSelectMeal={vi.fn()}
          pastMeals={[]}
          {...overrides}
        />
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  void i18n.changeLanguage('uk');
});

describe('DateMealSelector passed-meal edge case', () => {
  it('shows no explanation or CTA when the selected meal has not passed', () => {
    renderSelector({ mealType: 'lunch', pastMeals: [] });

    expect(screen.queryByText(/Резервування на цей прийом закрито/)).not.toBeInTheDocument();
  });

  it('shows an explanation and a "to next meal" CTA when the selected meal has passed', () => {
    renderSelector({ mealType: 'lunch', pastMeals: ['breakfast', 'lunch'] });

    expect(screen.getByText('Резервування на цей прийом закрито. Спробуйте Вечеря.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'До Вечеря →' })).toBeInTheDocument();
  });

  it('switches to the next available meal when the CTA is clicked', async () => {
    const user = userEvent.setup();
    const onSelectMeal = vi.fn();
    renderSelector({ mealType: 'lunch', pastMeals: ['breakfast', 'lunch'], onSelectMeal });

    await user.click(screen.getByRole('button', { name: 'До Вечеря →' }));

    expect(onSelectMeal).toHaveBeenCalledWith('dinner');
  });
});
