import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../app/i18n';
import { theme } from '../../../../../app/theme';
import { ArchiveDishDialog } from '../ArchiveDishDialog';

const renderDialog = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <ArchiveDishDialog open dishName="Грибне різото" onConfirm={vi.fn()} onCancel={vi.fn()} />
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  void i18n.changeLanguage('uk');
});

describe('ArchiveDishDialog', () => {
  it('shows a warning-tone folder badge above the title (05e·7)', () => {
    renderDialog();

    expect(screen.getByTestId('archive-dish-dialog-badge')).toBeInTheDocument();
    expect(screen.getByText('Архівувати страву?')).toBeInTheDocument();
  });
});
