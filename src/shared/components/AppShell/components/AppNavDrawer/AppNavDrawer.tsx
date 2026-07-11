import LogoutIcon from '@mui/icons-material/Logout';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { signOut } from '../../../../../infrastructure/firebase/authAdapter';
import { ColorSchemeMenuItem } from '../../../ColorSchemeMenuItem/ColorSchemeMenuItem';
import { LanguageSwitcher } from '../../../LanguageSwitcher/LanguageSwitcher';
import type { NavBadgeCounts } from '../../hooks/useNavBadgeCounts';
import type { NavigationDestination } from '../../types/navigationDestination';
import { styles } from './styles';

interface AppNavDrawerProps {
  destinations: NavigationDestination[];
  badgeCounts?: NavBadgeCounts;
  variant: 'permanent' | 'temporary';
  accountLabel: string;
  /** Temporary variant only: whether the drawer is open. */
  open?: boolean;
  /** Temporary variant only: called on backdrop tap / Escape. */
  onClose?: () => void;
  /** Called when a destination item is activated. */
  onNavigate?: () => void;
}

/**
 * Single navigation drawer rendered for both viewport variants: `permanent`
 * (always visible at `md`+) and `temporary` (mobile overlay opened from the
 * header hamburger). Hosts the role's destination list plus a footer with
 * the current account identity and a sign-out control.
 */
export const AppNavDrawer = ({
  destinations,
  badgeCounts,
  variant,
  accountLabel,
  open,
  onClose,
  onNavigate,
}: AppNavDrawerProps) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <Drawer
      id="app-nav-drawer"
      variant={variant}
      open={variant === 'permanent' ? true : (open ?? false)}
      onClose={onClose}
      sx={styles.drawer}
    >
      <Box component="nav" aria-label={t('nav.landmark')} sx={styles.nav}>
        <List>
          {destinations.map(destination => {
            const isActive = pathname === destination.path;
            const badgeCount = destination.badgeKey ? (badgeCounts?.[destination.badgeKey] ?? 0) : undefined;

            return (
              <ListItemButton
                key={destination.key}
                component={Link}
                to={destination.path}
                selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                sx={isActive ? styles.itemActive : undefined}
                onClick={onNavigate}
              >
                <ListItemIcon sx={isActive ? styles.itemIconActive : undefined}>
                  {badgeCount === undefined ? (
                    <destination.Icon />
                  ) : (
                    <Badge badgeContent={badgeCount} color="error">
                      <destination.Icon />
                    </Badge>
                  )}
                </ListItemIcon>
                <ListItemText primary={t(destination.labelKey)} />
              </ListItemButton>
            );
          })}
        </List>
        <Box sx={styles.spacer} />
        <Divider />
        <Box sx={styles.preferences}>
          <LanguageSwitcher fullWidth />
        </Box>
        <Divider />
        <List disablePadding>
          <ColorSchemeMenuItem />
        </List>
        <Divider />
        <Typography variant="body2" color="textSecondary" sx={styles.identity}>
          {accountLabel}
        </Typography>
        <List>
          <ListItemButton onClick={() => void signOut()}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary={t('auth.signOut')} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
};
