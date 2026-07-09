import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { AccessDeniedState } from './components/AccessDeniedState';
import { AuthLoadingState } from './components/AuthLoadingState';
import { useAuth } from './useAuth';

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * UX-only route guard for administrator-only content. Missing profile,
 * inactive profile, or a non-admin role all render the localized
 * access-denied state instead of `children`. Firestore Security Rules
 * remain the authorization boundary.
 */
export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { status, profile } = useAuth();

  if (status === 'loading') {
    return <AuthLoadingState />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  const isActiveAdmin = profile !== null && profile.active && profile.role === 'admin';

  if (!isActiveAdmin) {
    return <AccessDeniedState />;
  }

  return children;
};
