import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { signOut } from '../../../infrastructure/firebase/authAdapter';
import { styles } from './AccessDeniedState.styles';

/**
 * Localized access-denied state for authenticated visitors who are
 * unprovisioned, inactive, or not an administrator.
 */
export const AccessDeniedState = () => {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={styles.container}>
      <Typography variant="h1">{t('auth.accessDenied.title')}</Typography>
      <Typography align="center">{t('auth.accessDenied.description')}</Typography>
      <Button variant="outlined" onClick={() => void signOut()}>
        {t('auth.signOut')}
      </Button>
    </Stack>
  );
};
