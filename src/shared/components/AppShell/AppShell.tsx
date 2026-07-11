import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { useAuth } from '../../../features/auth/useAuth';
import { AppHeader } from '../AppHeader/AppHeader';
import { styles } from './AppShell.styles';
import { AppNavDrawer } from './components/AppNavDrawer/AppNavDrawer';
import { useNavBadgeCounts } from './hooks/useNavBadgeCounts';
import { selectDestinations } from './utils/selectDestinations';

/**
 * Application layout: header and a single role-aware navigation drawer
 * (permanent at `md`+, a temporary hamburger-triggered overlay below it),
 * plus the routed content.
 */
export const AppShell = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const destinations = role ? selectDestinations(role) : [];
  const badgeCounts = useNavBadgeCounts(role === 'admin');
  const accountParts = [user?.displayName, user?.email].filter(Boolean);
  const accountLabel = accountParts.length > 0 ? accountParts.join(' ') : t('auth.signedIn');

  return (
    <Box sx={styles.root}>
      <AppHeader
        onOpenNav={
          isDesktop
            ? undefined
            : () => {
                setMobileOpen(true);
              }
        }
      />
      <Box sx={styles.body}>
        <AppNavDrawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={mobileOpen}
          onClose={() => {
            setMobileOpen(false);
          }}
          onNavigate={() => {
            setMobileOpen(false);
          }}
          destinations={destinations}
          badgeCounts={badgeCounts}
          accountLabel={accountLabel}
        />
        <Box sx={styles.content}>
          <Box component="main" sx={styles.main}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
