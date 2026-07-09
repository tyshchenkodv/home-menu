import { render, screen, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserProfile } from '../../../shared/types/userProfile';

vi.mock('../../../infrastructure/firebase/authAdapter', () => ({
  subscribeToAuthState: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/userService', () => ({
  loadUserProfile: vi.fn(),
}));

vi.mock('../../../infrastructure/firebase/services/ingredientService', () => ({
  subscribeActiveIngredients: vi.fn(() => vi.fn()),
  subscribeArchivedIngredients: vi.fn(() => vi.fn()),
  createIngredient: vi.fn(),
  updateIngredient: vi.fn(),
  archiveIngredient: vi.fn(),
  restoreIngredient: vi.fn(),
}));

import { subscribeToAuthState } from '../../../infrastructure/firebase/authAdapter';
import { loadUserProfile } from '../../../infrastructure/firebase/services/userService';
import { App } from '../../../app/App';

const mockedSubscribeToAuthState = vi.mocked(subscribeToAuthState);
const mockedLoadUserProfile = vi.mocked(loadUserProfile);

const ADMIN_UID = 'test-admin-uid';
const ADMIN_EMAIL = 'admin@example.test';

const TEST_USER = { uid: ADMIN_UID, email: ADMIN_EMAIL } as unknown as User;

const buildProfile = (overrides: Partial<UserProfile>): UserProfile => ({
  displayName: 'Test Admin',
  email: ADMIN_EMAIL,
  role: 'admin',
  active: true,
  createdAt: {} as UserProfile['createdAt'],
  updatedAt: {} as UserProfile['updatedAt'],
  ...overrides,
});

const emitAuthUser = (user: User | null) => {
  mockedSubscribeToAuthState.mockImplementation(onChange => {
    onChange(user);
    return () => undefined;
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  window.location.hash = '#/admin/inventory';
});

describe('route guards', () => {
  it('redirects an unauthenticated visitor on /admin/inventory to /login', async () => {
    emitAuthUser(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Вхід до системи' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Запаси' })).not.toBeInTheDocument();
  });

  it('shows access-denied for an authenticated but unprovisioned user', async () => {
    emitAuthUser(TEST_USER);
    mockedLoadUserProfile.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Доступ заборонено' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Запаси' })).not.toBeInTheDocument();
  });

  it('shows access-denied for an inactive profile', async () => {
    emitAuthUser(TEST_USER);
    mockedLoadUserProfile.mockResolvedValue(buildProfile({ active: false, role: 'admin' }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Доступ заборонено' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Запаси' })).not.toBeInTheDocument();
  });

  it('shows access-denied for an active non-admin profile', async () => {
    emitAuthUser(TEST_USER);
    mockedLoadUserProfile.mockResolvedValue(buildProfile({ active: true, role: 'user' }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Доступ заборонено' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Запаси' })).not.toBeInTheDocument();
  });

  it('reaches the inventory placeholder for an active admin', async () => {
    emitAuthUser(TEST_USER);
    mockedLoadUserProfile.mockResolvedValue(buildProfile({ active: true, role: 'admin' }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Запаси' })).toBeInTheDocument();
    });
  });
});
