import { use } from 'react';

import { AuthContext, type AuthContextValue } from './authContextValue';

/** Reads the auth context; throws when used outside `AuthProvider`. */
export const useAuth = (): AuthContextValue => {
  const context = use(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
