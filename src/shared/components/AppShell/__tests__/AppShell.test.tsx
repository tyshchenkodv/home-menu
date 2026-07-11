import { ThemeProvider } from '@mui/material/styles';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '../../../../app/i18n';
import { theme } from '../../../../app/theme';
import type { AuthContextValue } from '../../../../features/auth/authContextValue';
import type { OrderWithId } from '../../../types/order';
import type { UserProfile } from '../../../types/userProfile';
import { AppShell } from '../AppShell';

const mockedUseAuth = vi.fn<() => AuthContextValue>();
const signOutMock = vi.hoisted(() => vi.fn());

const { subscribeAdminBoardOrdersMock, subscribeAllIngredientsMock } = vi.hoisted(() => ({
  subscribeAdminBoardOrdersMock: vi.fn(),
  subscribeAllIngredientsMock: vi.fn(),
}));

vi.mock('../../../../features/auth/useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

vi.mock('../../../../infrastructure/firebase/services/orderService', () => ({
  subscribeAdminBoardOrders: subscribeAdminBoardOrdersMock,
}));

vi.mock('../../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeAllIngredients: subscribeAllIngredientsMock,
}));

vi.mock('../../../../infrastructure/firebase/authAdapter', () => ({
  signOut: signOutMock,
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
  subscribeAdminBoardOrdersMock.mockReturnValue(vi.fn());
  subscribeAllIngredientsMock.mockReturnValue(vi.fn());
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.clearAllMocks();
});

describe('AppShell', () => {
  describe('mobile (below md)', () => {
    it('hides nav links until the hamburger is opened, then shows the full admin destination set', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: buildProfile({ role: 'admin' }),
        role: 'admin',
        isActive: true,
      });

      renderShell('/admin');

      expect(screen.queryByRole('link', { name: i18n.t('nav.menu') })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: i18n.t('nav.openMenu') }));

      expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.dashboard') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.cookingRequests') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.dishes') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.inventory') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.batches') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.help') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.settings') })).toBeInTheDocument();
    });

    it('shows every user destination once opened', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: buildProfile({ role: 'user' }),
        role: 'user',
        isActive: true,
      });

      renderShell('/menu');

      await user.click(screen.getByRole('button', { name: i18n.t('nav.openMenu') }));

      expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.myOrders') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.help') })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: i18n.t('nav.settings') })).not.toBeInTheDocument();
    });

    it('closes the drawer and calls signOut when the footer sign-out control is used', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: { email: 'user@example.test' } as AuthContextValue['user'],
        profile: buildProfile({ role: 'user' }),
        role: 'user',
        isActive: true,
      });

      renderShell('/menu');

      await user.click(screen.getByRole('button', { name: i18n.t('nav.openMenu') }));
      expect(screen.getByText('user@example.test')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: i18n.t('auth.signOut') }));

      expect(signOutMock).toHaveBeenCalledOnce();
    });

    it('renders no destinations when role is undefined, even after opening the drawer', async () => {
      const user = userEvent.setup();
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: null,
        role: undefined,
        isActive: undefined,
      });

      renderShell('/menu');

      await user.click(screen.getByRole('button', { name: i18n.t('nav.openMenu') }));

      expect(screen.queryByRole('link', { name: i18n.t('nav.menu') })).not.toBeInTheDocument();
    });
  });

  describe('desktop (md and up)', () => {
    it('renders the permanent drawer with all admin destinations and no hamburger', () => {
      setDesktopViewport(true);
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: buildProfile({ role: 'admin' }),
        role: 'admin',
        isActive: true,
      });

      renderShell('/admin');

      expect(screen.queryByRole('button', { name: i18n.t('nav.openMenu') })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.dashboard') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.cookingRequests') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.batches') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.dishes') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.help') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: i18n.t('nav.settings') })).toBeInTheDocument();
    });

    it('shows the account label and sign-out control in the permanent drawer footer', () => {
      setDesktopViewport(true);
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: { email: 'admin@example.test' } as AuthContextValue['user'],
        profile: buildProfile({ role: 'admin' }),
        role: 'admin',
        isActive: true,
      });

      renderShell('/admin');

      expect(screen.getByText('admin@example.test')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: i18n.t('auth.signOut') })).toBeInTheDocument();
    });

    it('falls back to the generic signed-in label when no email or display name is available', () => {
      setDesktopViewport(true);
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: null,
        role: 'admin',
        isActive: true,
      });

      renderShell('/admin');

      expect(screen.getByText(i18n.t('auth.signedIn'))).toBeInTheDocument();
    });

    it('marks the active route destination with aria-current', () => {
      setDesktopViewport(true);
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: buildProfile({ role: 'admin' }),
        role: 'admin',
        isActive: true,
      });

      renderShell('/admin');

      const adminLink = screen.getByRole('link', { name: i18n.t('nav.dashboard') });
      expect(adminLink).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: i18n.t('nav.menu') })).not.toHaveAttribute('aria-current');
    });

    it('shows badge counts on the cooking-requests and inventory drawer items for admin', () => {
      setDesktopViewport(true);
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: buildProfile({ role: 'admin' }),
        role: 'admin',
        isActive: true,
      });

      let ordersCallback: ((orders: OrderWithId[]) => void) | undefined;
      let ingredientsCallback: ((ingredients: unknown[]) => void) | undefined;

      subscribeAdminBoardOrdersMock.mockImplementation((onNext: (orders: OrderWithId[]) => void) => {
        ordersCallback = onNext;
        return vi.fn();
      });
      subscribeAllIngredientsMock.mockImplementation((onNext: (ingredients: unknown[]) => void) => {
        ingredientsCallback = onNext;
        return vi.fn();
      });

      renderShell('/admin');

      act(() => {
        ordersCallback?.([{ status: 'pending' }, { status: 'pending' }] as OrderWithId[]);
        ingredientsCallback?.([{ trackingMode: 'quantity', quantity: 1, lowStockThreshold: 5 }]);
      });

      const cookingRequestsLink = screen.getByRole('link', { name: i18n.t('nav.cookingRequests') });
      const inventoryLink = screen.getByRole('link', { name: i18n.t('nav.inventory') });
      expect(within(cookingRequestsLink).getByText('2')).toBeInTheDocument();
      expect(within(inventoryLink).getByText('1')).toBeInTheDocument();
    });

    it('renders no badge when the counts are zero', () => {
      setDesktopViewport(true);
      mockedUseAuth.mockReturnValue({
        status: 'authenticated',
        user: null,
        profile: buildProfile({ role: 'admin' }),
        role: 'admin',
        isActive: true,
      });
      subscribeAdminBoardOrdersMock.mockImplementation(() => vi.fn());
      subscribeAllIngredientsMock.mockImplementation(() => vi.fn());

      renderShell('/admin');

      const cookingRequestsLink = screen.getByRole('link', { name: i18n.t('nav.cookingRequests') });
      expect(within(cookingRequestsLink).queryByText('0')).not.toBeInTheDocument();
    });
  });
});
