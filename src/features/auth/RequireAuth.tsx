import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingState } from './components/AuthLoadingState';
import { useAuth } from './useAuth';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * UX-only route guard: shows a loading state while auth resolves, redirects
 * unauthenticated visitors to `/login`, and otherwise renders `children`.
 * Firestore Security Rules remain the authorization boundary.
 */
export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { status } = useAuth();

  if (status === 'loading') {
    return <AuthLoadingState />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
};
