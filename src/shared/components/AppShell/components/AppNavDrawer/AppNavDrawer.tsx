import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import type { NavigationDestination } from '../../types/navigationDestination';
import { styles } from './styles';

interface AppNavDrawerProps {
  destinations: NavigationDestination[];
}

/** Persistent, always-visible navigation drawer shown at `md`+ viewports. */
export const AppNavDrawer = ({ destinations }: AppNavDrawerProps) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <Drawer variant="permanent" sx={styles.drawer}>
      <List>
        {destinations.map(destination => {
          const isActive = pathname === destination.path;

          return (
            <ListItemButton
              key={destination.key}
              component={Link}
              to={destination.path}
              selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              sx={isActive ? styles.itemActive : undefined}
            >
              <ListItemIcon sx={isActive ? styles.itemActive : undefined}>
                <destination.Icon />
              </ListItemIcon>
              <ListItemText primary={t(destination.labelKey)} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
};
