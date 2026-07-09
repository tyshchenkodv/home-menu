import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { signInWithGoogle } from '../../infrastructure/firebase/authAdapter';
import { styles } from './LoginPage.styles';
import { useAuth } from './useAuth';

export const LoginPage = () => {
  const { t } = useTranslation();
  const { status, profile } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isActiveAdmin = status === 'authenticated' && profile !== null && profile.active && profile.role === 'admin';

  if (isActiveAdmin) {
    return <Navigate to="/admin/inventory" replace />;
  }

  const handleSignIn = async () => {
    setHasError(false);
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch {
      setHasError(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Stack spacing={2} sx={styles.container}>
      <Typography variant="h1">{t('auth.login.title')}</Typography>
      <Button variant="contained" onClick={() => void handleSignIn()} disabled={isSigningIn}>
        {isSigningIn ? (
          <CircularProgress size={20} aria-label={t('auth.login.signingIn')} />
        ) : (
          t('auth.login.googleButton')
        )}
      </Button>
      {hasError && <Typography color="error">{t('auth.login.error')}</Typography>}
    </Stack>
  );
};
