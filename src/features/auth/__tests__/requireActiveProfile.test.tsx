import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import '../../../app/i18n';
import type { AuthContextValue } from '../authContextValue';

const mockedUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('../useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

vi.mock('../../../infrastructure/firebase/authAdapter', () => ({
  signOut: vi.fn(),
}));

import { RequireActiveProfile } from '../RequireActiveProfile';

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route
          path="/protected"
          element={
            <RequireActiveProfile>
              <div>protected content</div>
            </RequireActiveProfile>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('RequireActiveProfile', () => {
  it('renders children for an active admin', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: null,
      role: 'admin',
      isActive: true,
    });

    renderGuard();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('renders children for an active non-admin user', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: null,
      role: 'user',
      isActive: true,
    });

    renderGuard();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('shows the unified not-activated screen for an inactive account', () => {
    mockedUseAuth.mockReturnValue({
      status: 'notActivated',
      user: { email: 'user@example.test' } as never,
      profile: null,
      role: 'user',
      isActive: false,
    });

    renderGuard();

    expect(screen.getByRole('heading', { name: 'Профіль ще не активовано' })).toBeInTheDocument();
  });

  it('shows the unified not-activated screen for an un-provisioned account', () => {
    mockedUseAuth.mockReturnValue({
      status: 'notActivated',
      user: { email: 'user@example.test' } as never,
      profile: null,
      role: undefined,
      isActive: false,
    });

    renderGuard();

    expect(screen.getByRole('heading', { name: 'Профіль ще не активовано' })).toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to /login', () => {
    mockedUseAuth.mockReturnValue({
      status: 'unauthenticated',
      user: null,
      profile: null,
      role: undefined,
      isActive: false,
    });

    renderGuard();

    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('shows a retryable error state when profile loading fails', () => {
    mockedUseAuth.mockReturnValue({
      status: 'error',
      user: null,
      profile: null,
      role: undefined,
      isActive: false,
    });

    renderGuard();

    expect(screen.queryByRole('heading', { name: 'Профіль ще не активовано' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторити' })).toBeInTheDocument();
  });

  it('shows the loading state while auth resolves', () => {
    mockedUseAuth.mockReturnValue({
      status: 'loading',
      user: null,
      profile: null,
      role: undefined,
      isActive: false,
    });

    renderGuard();

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
