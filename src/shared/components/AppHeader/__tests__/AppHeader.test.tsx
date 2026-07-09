import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { i18n } from '../../../../app/i18n';
import { theme } from '../../../../app/theme';
import { AppHeader } from '../AppHeader';

const renderHeader = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <AppHeader />
      </ThemeProvider>
    </I18nextProvider>,
  );
};

describe('AppHeader', () => {
  it('renders the header landmark with the brand mark and wordmark', () => {
    renderHeader();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('app.title'))).toBeInTheDocument();
    expect(screen.getByRole('banner').querySelector('svg')).toBeInTheDocument();
  });

  it('renders the language switcher controls', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: i18n.t('common.languageUk') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('common.languageEn') })).toBeInTheDocument();
  });

  it('renders the dark mode toggle', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: i18n.t('common.toggleDarkMode') })).toBeInTheDocument();
  });
});
