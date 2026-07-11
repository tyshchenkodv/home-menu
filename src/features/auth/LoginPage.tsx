import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { signInWithGoogle } from '../../infrastructure/firebase/authAdapter';
import { CatArt } from '../../shared/components/CatArt/CatArt';
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
    <Stack sx={styles.page}>
      <Stack spacing={3} sx={styles.card}>
        <Box sx={styles.mascot}>
          <CatArt variant="idle" size={140} />
        </Box>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={styles.brandRow}>
            <Box sx={styles.mark}>
              <CatArt variant="logo" size={32} />
            </Box>
            <Typography variant="h2" sx={styles.wordmark}>
              {t('app.title')}
            </Typography>
          </Stack>
          <Typography variant="body1" sx={styles.tagline}>
            {t('auth.login.tagline')}
          </Typography>
        </Stack>
        <Typography variant="h1" sx={styles.title}>
          {t('auth.login.title')}
        </Typography>
        <Stack spacing={2} sx={styles.actions}>
          <Button variant="contained" fullWidth onClick={() => void handleSignIn()} disabled={isSigningIn}>
            {isSigningIn ? (
              <CircularProgress size={20} aria-label={t('auth.login.signingIn')} />
            ) : (
              t('auth.login.googleButton')
            )}
          </Button>
          {hasError && <Typography color="error">{t('auth.login.error')}</Typography>}
        </Stack>
      </Stack>
    </Stack>
  );
};
