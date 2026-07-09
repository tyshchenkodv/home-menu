import type { User } from 'firebase/auth';
import { useEffect, useState, type ReactNode } from 'react';

import { subscribeToAuthState } from '../../infrastructure/firebase/authAdapter';
import { loadUserProfile } from '../../infrastructure/firebase/services/userService';
import type { UserProfile } from '../../shared/types/userProfile';
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContextValue';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Holds the Firebase Auth user, the loaded `users/{uid}` profile, and a
 * combined loading/authenticated/unauthenticated status. Subscribes to auth
 * state changes and loads the profile on sign-in; does not cache any other
 * data.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeToAuthState(nextUser => {
      if (cancelled) {
        return;
      }

      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setStatus('unauthenticated');
        return;
      }

      setStatus('loading');

      void loadUserProfile(nextUser.uid)
        .then(nextProfile => {
          if (cancelled) {
            return;
          }

          setProfile(nextProfile);
          setStatus('authenticated');
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          setProfile(null);
          setStatus('authenticated');
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value: AuthContextValue = { user, profile, status };

  return <AuthContext value={value}>{children}</AuthContext>;
};
