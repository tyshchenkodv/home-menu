import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { useAuth } from '../../../features/auth/useAuth';
import { AppHeader } from '../AppHeader/AppHeader';
import { styles } from './AppShell.styles';
import { AppNavBottom } from './components/AppNavBottom/AppNavBottom';
import { AppNavDrawer } from './components/AppNavDrawer/AppNavDrawer';
import { selectDestinations } from './utils/selectDestinations';

/**
 * Application layout: header, role-aware responsive navigation (persistent
 * drawer at `md`+, bottom navigation below it), and the routed content.
 */
export const AppShell = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { profile } = useAuth();

  const destinations = profile ? selectDestinations(profile.role) : [];

  return (
    <Box sx={styles.root}>
      <AppHeader />
      <Box component="nav" aria-label={t('nav.landmark')} sx={styles.body}>
        {isDesktop ? <AppNavDrawer destinations={destinations} /> : null}
        <Box sx={styles.content}>
          <Box component="main" sx={styles.main}>
            <Outlet />
          </Box>
          {isDesktop ? null : <AppNavBottom destinations={destinations} />}
        </Box>
      </Box>
    </Box>
  );
};
