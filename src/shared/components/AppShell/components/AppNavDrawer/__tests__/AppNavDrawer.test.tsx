import Inventory2 from '@mui/icons-material/Inventory2';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../../../app/i18n';
import { theme } from '../../../../../../app/theme';
import type { NavigationDestination } from '../../../types/navigationDestination';
import { AppNavDrawer } from '../AppNavDrawer';

const signOutMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../../infrastructure/firebase/authAdapter', () => ({
  signOut: signOutMock,
}));

const destinations: NavigationDestination[] = [
  { key: 'menu', path: '/menu', labelKey: 'nav.menu', Icon: RestaurantMenu, roles: ['admin', 'user'] },
  {
    key: 'inventory',
    path: '/admin/inventory',
    labelKey: 'nav.inventory',
    Icon: Inventory2,
    roles: ['admin'],
    badgeKey: 'lowStock',
  },
];

const renderDrawer = (props: Partial<React.ComponentProps<typeof AppNavDrawer>> = {}) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <MemoryRouter initialEntries={['/menu']}>
          <AppNavDrawer destinations={destinations} variant="temporary" accountLabel="user@example.test" {...props} />
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>,
  );

describe('AppNavDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders no destination links when temporary and closed', () => {
    renderDrawer({ open: false });

    expect(screen.queryByRole('link', { name: i18n.t('nav.menu') })).not.toBeInTheDocument();
  });

  it('renders destination links when temporary and open', () => {
    renderDrawer({ open: true });

    expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.inventory') })).toBeInTheDocument();
  });

  it('renders the footer with the account label and a sign-out control', () => {
    renderDrawer({ open: true });

    expect(screen.getByText('user@example.test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('auth.signOut') })).toBeInTheDocument();
  });

  it('renders the language switcher and theme toggle in the footer', () => {
    renderDrawer({ open: true });

    expect(screen.getByRole('button', { name: i18n.t('common.languageUk') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('common.languageEn') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('common.darkMode') })).toBeInTheDocument();
  });

  it('calls signOut when the sign-out control is clicked', async () => {
    const user = userEvent.setup();
    renderDrawer({ open: true });

    await user.click(screen.getByRole('button', { name: i18n.t('auth.signOut') }));

    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it('calls onNavigate when a destination item is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderDrawer({ open: true, onNavigate });

    await user.click(screen.getByRole('link', { name: i18n.t('nav.inventory') }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('renders destination links for the permanent variant regardless of open', () => {
    renderDrawer({ variant: 'permanent' });

    expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
  });
});
