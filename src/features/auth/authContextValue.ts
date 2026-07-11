import type { User } from 'firebase/auth';
import { createContext } from 'react';

import type { UserProfile, UserRole } from '../../shared/types/userProfile';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'notActivated' | 'error';

export interface AuthContextValue {
  user: User | null;
  /** Non-authoritative display record (`users/{uid}`); never used for authorization. */
  profile: UserProfile | null;
  /**
   * Authorization role derived from the ID token custom claims. `undefined`
   * when not signed in or un-provisioned. Optional so existing test doubles
   * for `useAuth` that predate the claims migration keep compiling.
   */
  role?: UserRole | undefined;
  /** Authorization activity flag derived from the ID token `isActive` custom claim. Same optionality note as `role`. */
  isActive?: boolean;
  status: AuthStatus;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
