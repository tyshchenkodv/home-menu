import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../features/auth/useAuth';
import { StatePlaceholder } from '../shared/components/StatePlaceholder/StatePlaceholder';

/**
 * Root-path redirect: sends an admin to `/admin`, a regular user to `/menu`,
 * and anyone else to `/login` (defensive; the surrounding guard normally
 * handles unauthenticated visitors). Shows a loading state while auth
 * resolves.
 */
export const RootRedirect = () => {
  const { t } = useTranslation();
  const { status, profile } = useAuth();

  if (status === 'loading') {
    return <StatePlaceholder variant="sleeping" message={t('common.loading')} />;
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (profile?.role === 'user') {
    return <Navigate to="/menu" replace />;
  }

  return <Navigate to="/login" replace />;
};
