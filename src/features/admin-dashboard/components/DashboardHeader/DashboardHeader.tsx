import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CatArt } from '../../../../shared/components/CatArt/CatArt';

/**
 * Dashboard page header from docs/design/screens/admin-dashboard.md: a
 * secondary-colored "Admin" overline above the "Dashboard" title, with the
 * idle CatArt mascot at the right and a divider beneath.
 */
export const DashboardHeader = () => {
  const { t } = useTranslation();

  return (
    <Box component="header">
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            variant="overline"
            color="secondary"
            component="p"
            sx={{ textTransform: 'none', fontWeight: 700, letterSpacing: 0 }}
          >
            {t('dashboard.adminOverline')}
          </Typography>
          <Typography variant="h1">{t('dashboard.title')}</Typography>
        </Box>
        <CatArt variant="idle" size={56} />
      </Stack>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};
