import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { signInWithEmailAndPassword } from '../../infrastructure/firebase/authAdapter';
import { CatArt } from '../../shared/components/CatArt/CatArt';
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher/LanguageSwitcher';
import { NotActivatedState } from './components/NotActivatedState';
import { styles } from './LoginPage.styles';
import { useAuth } from './useAuth';

const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginErrorKey = 'invalidCredentials' | 'tooManyRequests' | 'network' | 'generic';

const resolveLoginErrorKey = (error: unknown): LoginErrorKey => {
  if (!(error instanceof FirebaseError)) {
    return 'generic';
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'invalidCredentials';
    case 'auth/too-many-requests':
      return 'tooManyRequests';
    case 'auth/network-request-failed':
      return 'network';
    default:
      return 'generic';
  }
};

export const LoginPage = () => {
  const { t } = useTranslation();
  const { status, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorKey, setErrorKey] = useState<LoginErrorKey | null>(null);

  if (status === 'authenticated' && role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (status === 'authenticated' && role === 'user') {
    return <Navigate to="/menu" replace />;
  }

  if (status === 'notActivated') {
    return <NotActivatedState />;
  }

  const isEmailValid = EMAIL_FORMAT_PATTERN.test(email);
  const isFormValid = isEmailValid && password.length > 0;

  const handleSubmit = async () => {
    if (!isFormValid || isSigningIn) {
      return;
    }

    setErrorKey(null);
    setIsSigningIn(true);

    try {
      await signInWithEmailAndPassword(email, password);
    } catch (error) {
      setErrorKey(resolveLoginErrorKey(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Stack sx={styles.page}>
      <Box sx={styles.languageSwitcher}>
        <LanguageSwitcher />
      </Box>
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
        <Stack
          component="form"
          spacing={2}
          sx={styles.form}
          onSubmit={event => {
            event.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <TextField
            fullWidth
            type="email"
            label={t('auth.login.emailLabel')}
            autoComplete="email"
            value={email}
            onChange={event => {
              setEmail(event.target.value);
            }}
          />
          <TextField
            fullWidth
            type={isPasswordVisible ? 'text' : 'password'}
            label={t('auth.login.passwordLabel')}
            autoComplete="current-password"
            value={password}
            onChange={event => {
              setPassword(event.target.value);
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      sx={styles.passwordToggle}
                      aria-label={isPasswordVisible ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                      onClick={() => {
                        setIsPasswordVisible(visible => !visible);
                      }}
                      edge="end"
                    >
                      {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button type="submit" variant="contained" fullWidth disabled={!isFormValid || isSigningIn}>
            {isSigningIn ? (
              <CircularProgress size={20} aria-label={t('auth.login.signingIn')} />
            ) : (
              t('auth.login.submit')
            )}
          </Button>
          {errorKey && <Typography color="error">{t(`auth.login.errors.${errorKey}`)}</Typography>}
        </Stack>
        <Typography variant="body2" sx={styles.hint}>
          {t('auth.login.noAccessHint')}
        </Typography>
      </Stack>
    </Stack>
  );
};
