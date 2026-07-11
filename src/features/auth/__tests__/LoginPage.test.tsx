import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import '../../../app/i18n';
import type { AuthContextValue } from '../authContextValue';

const mockedUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('../useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

vi.mock('../../../infrastructure/firebase/authAdapter', () => ({
  signInWithGoogle: vi.fn(),
}));

import { LoginPage } from '../LoginPage';

const renderLoginPage = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );

describe('LoginPage', () => {
  it('renders the app wordmark, tagline, and the Google sign-in button', () => {
    mockedUseAuth.mockReturnValue({ status: 'unauthenticated', user: null, profile: null });

    renderLoginPage();

    expect(screen.getByText('Домашнє меню')).toBeInTheDocument();
    expect(screen.getByText('Домашній облік їжі та меню родини')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Увійти через Google' })).toBeInTheDocument();
  });

  it('redirects an active admin to the inventory page', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: {
        displayName: 'Test Admin',
        email: 'admin@example.test',
        role: 'admin',
        active: true,
        createdAt: {} as never,
        updatedAt: {} as never,
      },
    });

    renderLoginPage();

    expect(screen.queryByRole('button', { name: 'Увійти через Google' })).not.toBeInTheDocument();
  });
});
