import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Typed fake of the Firebase Auth boundary, mirroring the
 * `settingsService.test.ts` pattern: enough of the `firebase/auth` surface
 * for `authAdapter.ts` to exercise its real control flow while we assert on
 * the fake's spies.
 */
const mockGetAuth = vi.fn(() => ({ __auth: true }));
const mockUser = { uid: 'user-1', email: 'owner@home-menu.test' };
const mockSignInWithEmailAndPassword = vi.fn(() => Promise.resolve({ user: mockUser }));

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../firebaseApp', () => ({
  getFirebaseApp: vi.fn(() => ({ __app: true })),
}));

const { signInWithEmailAndPassword } = await import('../authAdapter');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInWithEmailAndPassword', () => {
  it('calls the Firebase modular sign-in function with the auth instance, email, and password', async () => {
    const authInstance = { __auth: true };
    mockGetAuth.mockReturnValue(authInstance);

    const result = await signInWithEmailAndPassword('owner@home-menu.test', 'super-secret');

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(authInstance, 'owner@home-menu.test', 'super-secret');
    expect(result).toBe(mockUser);
  });
});
