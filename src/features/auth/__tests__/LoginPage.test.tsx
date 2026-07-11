import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FirebaseError } from 'firebase/app';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import '../../../app/i18n';
import type { AuthContextValue } from '../authContextValue';

const mockedUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('../useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

vi.mock('../../../infrastructure/firebase/authAdapter', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

import { signInWithEmailAndPassword } from '../../../infrastructure/firebase/authAdapter';
import { LoginPage } from '../LoginPage';

const mockedSignInWithEmailAndPassword = vi.mocked(signInWithEmailAndPassword);

const unauthenticated: AuthContextValue = {
  status: 'unauthenticated',
  user: null,
  profile: null,
  role: undefined,
  isActive: false,
};

const renderLoginPage = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );

describe('LoginPage', () => {
  it('renders the wordmark, tagline, language switcher, form fields, and the no-access hint', () => {
    mockedUseAuth.mockReturnValue(unauthenticated);

    renderLoginPage();

    expect(screen.getByText('Домашнє меню')).toBeInTheDocument();
    expect(screen.getByText('Домашній облік їжі та меню родини')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'UK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    expect(screen.getByLabelText('Ел. пошта')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Показати пароль' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Увійти' })).toBeInTheDocument();
    expect(screen.getByText(/адміністратора/)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    mockedUseAuth.mockReturnValue(unauthenticated);

    renderLoginPage();

    const passwordField = screen.getByLabelText('Пароль');
    expect(passwordField).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }));

    expect(passwordField).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Приховати пароль' })).toBeInTheDocument();
  });

  it('submits the typed email and password to the adapter', async () => {
    mockedUseAuth.mockReturnValue(unauthenticated);
    mockedSignInWithEmailAndPassword.mockResolvedValue(undefined as never);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Ел. пошта'), { target: { value: 'user@example.test' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Увійти' }));

    await waitFor(() => {
      expect(mockedSignInWithEmailAndPassword).toHaveBeenCalledWith('user@example.test', 'secret123');
    });
  });

  it('disables submit until email and password are valid', () => {
    mockedUseAuth.mockReturnValue(unauthenticated);

    renderLoginPage();

    expect(screen.getByRole('button', { name: 'Увійти' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Ел. пошта'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } });

    expect(screen.getByRole('button', { name: 'Увійти' })).toBeDisabled();
  });

  it('shows the localized invalid-credentials message and re-enables the form on a rejection', async () => {
    mockedUseAuth.mockReturnValue(unauthenticated);
    mockedSignInWithEmailAndPassword.mockRejectedValue(
      new FirebaseError('auth/invalid-credential', 'Invalid credential'),
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Ел. пошта'), { target: { value: 'user@example.test' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Увійти' }));

    await waitFor(() => {
      expect(screen.getByText('Невірний email або пароль.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Увійти' })).not.toBeDisabled();
  });

  it('redirects an authenticated admin (does not render the submit button)', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: null,
      role: 'admin',
      isActive: true,
    });

    renderLoginPage();

    expect(screen.queryByRole('button', { name: 'Увійти' })).not.toBeInTheDocument();
  });

  it('redirects an authenticated user (does not render the submit button)', () => {
    mockedUseAuth.mockReturnValue({
      status: 'authenticated',
      user: null,
      profile: null,
      role: 'user',
      isActive: true,
    });

    renderLoginPage();

    expect(screen.queryByRole('button', { name: 'Увійти' })).not.toBeInTheDocument();
  });

  it('shows the unified not-activated screen for a not-activated account', () => {
    mockedUseAuth.mockReturnValue({
      status: 'notActivated',
      user: null,
      profile: null,
      role: undefined,
      isActive: false,
    });

    renderLoginPage();

    expect(screen.getByRole('heading', { name: 'Профіль ще не активовано' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Увійти' })).not.toBeInTheDocument();
  });
});
