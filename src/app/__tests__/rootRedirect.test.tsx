import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { AuthContextValue } from '../../features/auth/authContextValue';
import type { UserProfile } from '../../shared/types/userProfile';

const mockedUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('../../features/auth/useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

import { RootRedirect } from '../RootRedirect';

const buildProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  displayName: 'Test User',
  email: 'user@example.test',
  role: 'user',
  active: true,
  createdAt: {} as UserProfile['createdAt'],
  updatedAt: {} as UserProfile['updatedAt'],
  ...overrides,
});

const renderRootRedirect = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin" element={<div>admin page</div>} />
        <Route path="/menu" element={<div>menu page</div>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RootRedirect', () => {
  it('redirects an admin to /admin', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: buildProfile({ role: 'admin' }),
    });

    renderRootRedirect();

    expect(screen.getByText('admin page')).toBeInTheDocument();
  });

  it('redirects a regular user to /menu', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: buildProfile({ role: 'user' }),
    });

    renderRootRedirect();

    expect(screen.getByText('menu page')).toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to /login', () => {
    mockedUseAuth.mockReturnValue({
      status: 'unauthenticated',
      user: null,
      profile: null,
    });

    renderRootRedirect();

    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects an authenticated but unprovisioned profile to /login', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: null,
    });

    renderRootRedirect();

    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('shows the loading state while auth resolves', () => {
    mockedUseAuth.mockReturnValue({
      status: 'loading',
      user: null,
      profile: null,
    });

    renderRootRedirect();

    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
    expect(screen.queryByText('menu page')).not.toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
