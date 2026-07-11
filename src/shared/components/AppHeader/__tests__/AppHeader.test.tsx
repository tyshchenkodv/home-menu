import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../app/i18n';
import { theme } from '../../../../app/theme';
import { AppHeader } from '../AppHeader';

const renderHeader = (onOpenNav?: () => void) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <AppHeader onOpenNav={onOpenNav} />
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

  it('does not render the language switcher or theme controls (they live in the nav drawer)', () => {
    renderHeader();

    expect(screen.queryByRole('button', { name: i18n.t('common.languageUk') })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.t('common.darkMode') })).not.toBeInTheDocument();
  });

  it('renders a hamburger button and invokes onOpenNav when clicked', async () => {
    const user = userEvent.setup();
    const onOpenNav = vi.fn();

    renderHeader(onOpenNav);

    const menuButton = screen.getByRole('button', { name: i18n.t('nav.openMenu') });
    await user.click(menuButton);

    expect(onOpenNav).toHaveBeenCalledOnce();
  });

  it('renders no hamburger button when onOpenNav is not provided', () => {
    renderHeader();

    expect(screen.queryByRole('button', { name: i18n.t('nav.openMenu') })).not.toBeInTheDocument();
  });
});
