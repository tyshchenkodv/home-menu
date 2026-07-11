import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { StatePlaceholder } from '../../shared/components/StatePlaceholder/StatePlaceholder';
import { AuthLoadingState } from './components/AuthLoadingState';
import { NotActivatedState } from './components/NotActivatedState';
import { useAuth } from './useAuth';

interface RequireActiveProfileProps {
  children: ReactNode;
}

/**
 * UX-only route guard for signed-in, activated users. Gates on `useAuth`'s
 * status: `authenticated` already implies a valid role and `isActive` claim.
 * A signed-in but not-yet-activated account renders the unified
 * `NotActivatedState` (session kept, no automatic sign-out). A
 * display-profile-load failure renders a retryable error state. It does not
 * check role; role gating is handled separately by `RequireAdmin`.
 * Firestore Security Rules remain the authorization boundary.
 */
export const RequireActiveProfile = ({ children }: RequireActiveProfileProps) => {
  const { t } = useTranslation();
  const { status } = useAuth();

  if (status === 'loading') {
    return <AuthLoadingState />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'notActivated') {
    return <NotActivatedState />;
  }

  if (status === 'error') {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <StatePlaceholder variant="confused" title={t('auth.loadError.title')} message={t('auth.loadError.body')} />
        <Button
          variant="outlined"
          onClick={() => {
            window.location.reload();
          }}
        >
          {t('auth.loadError.retry')}
        </Button>
      </Stack>
    );
  }

  return children;
};
