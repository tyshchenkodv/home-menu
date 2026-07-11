import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { AccessDeniedState } from './components/AccessDeniedState';
import { AuthLoadingState } from './components/AuthLoadingState';
import { useAuth } from './useAuth';

interface RequireActiveProfileProps {
  children: ReactNode;
}

/**
 * UX-only route guard for provisioned, active users. Missing profile or an
 * inactive profile renders the localized access-denied state instead of
 * `children`. It does not check role; role gating is handled separately by
 * `RequireAdmin`. Firestore Security Rules remain the authorization boundary.
 */
export const RequireActiveProfile = ({ children }: RequireActiveProfileProps) => {
  const { status, profile } = useAuth();

  if (status === 'loading') {
    return <AuthLoadingState />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (!profile?.active) {
    return <AccessDeniedState />;
  }

  return children;
};
