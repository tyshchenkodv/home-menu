import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import '../../../app/i18n';
import type { UserProfile } from '../../../shared/types/userProfile';
import type { AuthContextValue } from '../authContextValue';

const mockedUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('../useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

import { RequireActiveProfile } from '../RequireActiveProfile';

const buildProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  displayName: 'Test User',
  email: 'user@example.test',
  role: 'user',
  active: true,
  createdAt: {} as UserProfile['createdAt'],
  updatedAt: {} as UserProfile['updatedAt'],
  ...overrides,
});

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
  it('renders children for an active admin profile', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: buildProfile({ role: 'admin', active: true }),
    });

    renderGuard();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('renders children for an active non-admin profile', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: buildProfile({ role: 'user', active: true }),
    });

    renderGuard();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('shows access-denied for an inactive profile', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: buildProfile({ active: false }),
    });

    renderGuard();

    expect(screen.getByRole('heading', { name: 'Доступ заборонено' })).toBeInTheDocument();
  });

  it('shows access-denied for an unprovisioned (null) profile', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: null,
    });

    renderGuard();

    expect(screen.getByRole('heading', { name: 'Доступ заборонено' })).toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to /login', () => {
    mockedUseAuth.mockReturnValue({
      status: 'unauthenticated',
      user: null,
      profile: null,
    });

    renderGuard();

    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('shows the loading state while auth resolves', () => {
    mockedUseAuth.mockReturnValue({
      status: 'loading',
      user: null,
      profile: null,
    });

    renderGuard();

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
