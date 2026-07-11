import type { User } from 'firebase/auth';
import { useEffect, useState, type ReactNode } from 'react';

import { subscribeToAuthState } from '../../infrastructure/firebase/authAdapter';
import { loadUserProfile } from '../../infrastructure/firebase/services/userService';
import type { UserProfile, UserRole } from '../../shared/types/userProfile';
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContextValue';

interface AuthProviderProps {
  children: ReactNode;
}

const isKnownRole = (value: unknown): value is UserRole => value === 'admin' || value === 'user';

/**
 * Holds the Firebase Auth user, its authorization claims (role/isActive, read
 * from the ID token), the non-authoritative `users/{uid}` display profile,
 * and a combined loading/authenticated/unauthenticated/notActivated status.
 *
 * Authorization is derived exclusively from the ID token custom claims via
 * `getIdTokenResult()`. A signed-in account without a known `role` claim or
 * with `isActive !== true` is not signed out: the session is kept and the
 * status is set to `notActivated` so the UI can show a "profile not
 * activated yet" screen that still lets the visitor sign themselves out.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    const resetToUnauthenticated = () => {
      setUser(null);
      setProfile(null);
      setRole(undefined);
      setIsActive(false);
      setStatus('unauthenticated');
    };

    const unsubscribe = subscribeToAuthState(nextUser => {
      if (cancelled) {
        return;
      }

      if (!nextUser) {
        resetToUnauthenticated();
        return;
      }

      setStatus('loading');

      void nextUser
        .getIdTokenResult()
        .then(tokenResult => {
          if (cancelled) {
            return;
          }

          const claimRole: unknown = tokenResult.claims.role;
          const claimIsActive = tokenResult.claims.isActive === true;

          if (!isKnownRole(claimRole) || !claimIsActive) {
            setUser(nextUser);
            setProfile(null);
            setRole(isKnownRole(claimRole) ? claimRole : undefined);
            setIsActive(claimIsActive);
            setStatus('notActivated');
            return;
          }

          setUser(nextUser);
          setRole(claimRole);
          setIsActive(claimIsActive);

          return loadUserProfile(nextUser.uid)
            .then(nextProfile => {
              if (cancelled) {
                return;
              }

              setProfile(nextProfile);
              setStatus('authenticated');
            })
            .catch((error: unknown) => {
              if (cancelled) {
                return;
              }

              if (import.meta.env.DEV) {
                console.error(error);
              }

              setProfile(null);
              setStatus('error');
            });
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }

          if (import.meta.env.DEV) {
            console.error(error);
          }

          setUser(null);
          setProfile(null);
          setRole(undefined);
          setIsActive(false);
          setStatus('error');
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value: AuthContextValue = { user, profile, role, isActive, status };

  return <AuthContext value={value}>{children}</AuthContext>;
};
