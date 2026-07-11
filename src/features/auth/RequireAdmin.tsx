import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingState } from './components/AuthLoadingState';
import { NotActivatedState } from './components/NotActivatedState';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * UX-only route guard for administrator-only content. Uses `usePermissions`
 * as the single source of the role/activation route check. A not-yet-active
 * account renders the unified `NotActivatedState`; an authenticated,
 * non-admin account is redirected to `/403`. Firestore Security Rules remain
 * the authorization boundary.
 */
export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { status } = useAuth();
  const { isAdmin } = usePermissions();

  if (status === 'loading') {
    return <AuthLoadingState />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'notActivated') {
    return <NotActivatedState />;
  }

  if (!isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return children;
};
