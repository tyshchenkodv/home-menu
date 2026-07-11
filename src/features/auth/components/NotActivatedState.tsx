import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { signOut } from '../../../infrastructure/firebase/authAdapter';
import { CatArt } from '../../../shared/components/CatArt/CatArt';
import { styles } from './NotActivatedState.styles';
import { useAuth } from '../useAuth';

/**
 * Unified state shown when a signed-in account is not yet activated: no
 * `role` custom claim, or `isActive !== true`. Keeps the session (no
 * automatic sign-out) and shows the signed-in email plus a manual sign-out
 * action. Replaces the former `NotAuthorizedState` and the inactive-account
 * use of `AccessDeniedState`.
 */
export const NotActivatedState = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <Stack spacing={2} sx={styles.container}>
      <CatArt variant="confused" size={88} />
      <Typography variant="h1">{t('auth.notActivated.title')}</Typography>
      <Typography align="center">{t('auth.notActivated.body', { email: user?.email ?? '' })}</Typography>
      <Box sx={styles.info}>
        <Typography>{t('auth.notActivated.contactAdmin')}</Typography>
      </Box>
      <Button variant="outlined" onClick={() => void signOut()}>
        {t('auth.signOut')}
      </Button>
    </Stack>
  );
};
