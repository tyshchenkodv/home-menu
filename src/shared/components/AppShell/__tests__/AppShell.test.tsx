import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../app/i18n';
import { theme } from '../../../../app/theme';
import type { AuthContextValue } from '../../../../features/auth/authContextValue';
import type { UserProfile } from '../../../types/userProfile';
import { AppShell } from '../AppShell';

const mockedUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('../../../../features/auth/useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

const buildProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  displayName: 'Test User',
  email: 'user@example.test',
  role: 'user',
  active: true,
  createdAt: {} as UserProfile['createdAt'],
  updatedAt: {} as UserProfile['updatedAt'],
  ...overrides,
});

const originalMatchMedia = window.matchMedia;

const setDesktopViewport = (matches: boolean) => {
  window.matchMedia = (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
};

const renderShell = (initialPath: string) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<div>dashboard page</div>} />
              <Route path="/menu" element={<div>menu page</div>} />
              <Route path="/admin/orders" element={<div>orders page</div>} />
              <Route path="/orders" element={<div>my orders page</div>} />
              <Route path="/admin/inventory" element={<div>inventory page</div>} />
              <Route path="/admin/batches" element={<div>batches page</div>} />
              <Route path="/admin/dishes" element={<div>dishes page</div>} />
              <Route path="/settings" element={<div>settings page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeEach(() => {
  setDesktopViewport(false);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.clearAllMocks();
});

describe('AppShell', () => {
  it('shows the admin primary destinations for an admin profile on mobile', () => {
    mockedUseAuth.mockReturnValue({ status: 'authenticated', user: null, profile: buildProfile({ role: 'admin' }) });

    renderShell('/admin');

    expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.orders') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.admin') })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: i18n.t('nav.inventory') })).not.toBeInTheDocument();
  });

  it('shows the user destinations for a user profile', () => {
    mockedUseAuth.mockReturnValue({ status: 'authenticated', user: null, profile: buildProfile({ role: 'user' }) });

    renderShell('/menu');

    expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.myOrders') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.settings') })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: i18n.t('nav.dashboard') })).not.toBeInTheDocument();
  });

  it('shows 3 primary actions for mobile admin with no More button', () => {
    mockedUseAuth.mockReturnValue({ status: 'authenticated', user: null, profile: buildProfile({ role: 'admin' }) });

    renderShell('/admin');

    const nav = screen.getByRole('navigation', { name: i18n.t('nav.landmark') });
    expect(within(nav).getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: i18n.t('nav.orders') })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: i18n.t('nav.admin') })).toBeInTheDocument();

    expect(within(nav).queryByRole('button', { name: i18n.t('nav.more') })).not.toBeInTheDocument();
  });

  it('shows all three user destinations on mobile with no More action', () => {
    mockedUseAuth.mockReturnValue({ status: 'authenticated', user: null, profile: buildProfile({ role: 'user' }) });

    renderShell('/menu');

    const nav = screen.getByRole('navigation', { name: i18n.t('nav.landmark') });
    expect(within(nav).getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: i18n.t('nav.myOrders') })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: i18n.t('nav.settings') })).toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: i18n.t('nav.more') })).not.toBeInTheDocument();
  });

  it('renders the permanent drawer with all admin destinations at md+ viewports', () => {
    setDesktopViewport(true);
    mockedUseAuth.mockReturnValue({ status: 'authenticated', user: null, profile: buildProfile({ role: 'admin' }) });

    renderShell('/admin');

    expect(screen.getByRole('link', { name: i18n.t('nav.admin') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.batches') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.dishes') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: i18n.t('nav.settings') })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.t('nav.more') })).not.toBeInTheDocument();
  });

  it('marks the active route destination with aria-current', () => {
    mockedUseAuth.mockReturnValue({ status: 'authenticated', user: null, profile: buildProfile({ role: 'admin' }) });

    renderShell('/admin');

    const adminLink = screen.getByRole('link', { name: i18n.t('nav.admin') });
    expect(adminLink).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).not.toHaveAttribute('aria-current');
  });
});
