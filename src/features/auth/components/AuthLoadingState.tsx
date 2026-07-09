import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

/** Shared loading indicator shown while auth state is resolving. */
export const AuthLoadingState = () => {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={{ py: 8, alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
      <Typography>{t('common.loading')}</Typography>
    </Stack>
  );
};
