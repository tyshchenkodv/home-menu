import { fireEvent, render, screen } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { describe, expect, it, vi } from 'vitest';

import '../../../../app/i18n';
import type { AuthContextValue } from '../../authContextValue';

const mockedUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('../../useAuth', () => ({
  useAuth: () => mockedUseAuth(),
}));

vi.mock('../../../../infrastructure/firebase/authAdapter', () => ({
  signOut: vi.fn(),
}));

import { signOut } from '../../../../infrastructure/firebase/authAdapter';
import { NotActivatedState } from '../NotActivatedState';

const mockedSignOut = vi.mocked(signOut);

describe('NotActivatedState', () => {
  it('renders the title, the signed-in email, the contact-admin block, and a working sign-out button', () => {
    mockedUseAuth.mockReturnValue({
      status: 'notActivated',
      user: { email: 'user@example.test' } as User,
      profile: null,
      role: undefined,
      isActive: false,
    });

    render(<NotActivatedState />);

    expect(screen.getByRole('heading', { name: 'Профіль ще не активовано' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ви увійшли як user@example.test, але адміністратор ще не активував ваш профіль у домогосподарстві.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Зверніться до адміністратора вашого дому 🏠')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Вийти' }));

    expect(mockedSignOut).toHaveBeenCalledTimes(1);
  });
});
