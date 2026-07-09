import type { User } from 'firebase/auth';
import { createContext } from 'react';

import type { UserProfile } from '../../shared/types/userProfile';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
