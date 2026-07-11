import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../infrastructure/firebase/authAdapter', () => ({
  subscribeToAuthState: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/userService', () => ({
  loadUserProfile: vi.fn(),
}));

import { signOut, subscribeToAuthState } from '../../../infrastructure/firebase/authAdapter';
import { loadUserProfile } from '../../../infrastructure/firebase/services/userService';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../useAuth';

const mockedSubscribeToAuthState = vi.mocked(subscribeToAuthState);
const mockedLoadUserProfile = vi.mocked(loadUserProfile);
const mockedSignOut = vi.mocked(signOut);

const buildUser = (claims: Record<string, unknown>) =>
  ({
    uid: 'user-1',
    getIdTokenResult: vi.fn().mockResolvedValue({ claims }),
  }) as never;

const Probe = () => {
  const { status, profile, role, isActive } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="profile">{profile ? 'has-profile' : 'no-profile'}</span>
      <span data-testid="role">{role ?? 'no-role'}</span>
      <span data-testid="isActive">{String(isActive)}</span>
    </div>
  );
};

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets status to error when loading the profile rejects', async () => {
    mockedSubscribeToAuthState.mockImplementation(callback => {
      callback(buildUser({ role: 'user', isActive: true }));
      return vi.fn();
    });
    mockedLoadUserProfile.mockRejectedValue(new Error('boom'));

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
  });

  it('sets status to authenticated with a null profile when the profile resolves to null', async () => {
    mockedSubscribeToAuthState.mockImplementation(callback => {
      callback(buildUser({ role: 'user', isActive: true }));
      return vi.fn();
    });
    mockedLoadUserProfile.mockResolvedValue(null);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
    expect(screen.getByTestId('role')).toHaveTextContent('user');
    expect(screen.getByTestId('isActive')).toHaveTextContent('true');
  });

  it('exposes role/isActive derived from the ID token claims for an authenticated admin', async () => {
    mockedSubscribeToAuthState.mockImplementation(callback => {
      callback(buildUser({ role: 'admin', isActive: true }));
      return vi.fn();
    });
    mockedLoadUserProfile.mockResolvedValue(null);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('role')).toHaveTextContent('admin');
    expect(screen.getByTestId('isActive')).toHaveTextContent('true');
  });

  it('keeps the session and sets status to notActivated when the token has no role claim', async () => {
    mockedSubscribeToAuthState.mockImplementation(callback => {
      callback(buildUser({}));
      return vi.fn();
    });

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('notActivated'));
    expect(mockedSignOut).not.toHaveBeenCalled();
    expect(mockedLoadUserProfile).not.toHaveBeenCalled();
    expect(screen.getByTestId('role')).toHaveTextContent('no-role');
    expect(screen.getByTestId('isActive')).toHaveTextContent('false');
  });

  it('sets status to notActivated when the token has a role but isActive is false', async () => {
    mockedSubscribeToAuthState.mockImplementation(callback => {
      callback(buildUser({ role: 'user', isActive: false }));
      return vi.fn();
    });

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('notActivated'));
    expect(mockedSignOut).not.toHaveBeenCalled();
    expect(mockedLoadUserProfile).not.toHaveBeenCalled();
    expect(screen.getByTestId('role')).toHaveTextContent('user');
    expect(screen.getByTestId('isActive')).toHaveTextContent('false');
  });

  it('sets status to unauthenticated when there is no signed-in user', async () => {
    mockedSubscribeToAuthState.mockImplementation(callback => {
      callback(null);
      return vi.fn();
    });

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });
});
