import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { MOBILE_NAV_INLINE_LIMIT } from '../../constants/mobileNavLimits';
import type { NavigationDestination } from '../../types/navigationDestination';
import { styles } from './styles';

interface AppNavBottomProps {
  destinations: NavigationDestination[];
}

/** Mobile bottom navigation showing the role's destinations. Smaller role-specific sets show all items; larger sets show only primary destinations. */
export const AppNavBottom = ({ destinations }: AppNavBottomProps) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const fitsInline = destinations.length <= MOBILE_NAV_INLINE_LIMIT;
  const visibleDestinations = fitsInline ? destinations : destinations.filter(destination => destination.mobilePrimary);

  const activeDestination = destinations.find(destination => destination.path === pathname);
  const activeValue = activeDestination?.path ?? false;

  return (
    <BottomNavigation showLabels value={activeValue} sx={styles.root}>
      {visibleDestinations.map(destination => (
        <BottomNavigationAction
          key={destination.key}
          label={t(destination.labelKey)}
          value={destination.path}
          icon={<destination.Icon />}
          component={Link}
          to={destination.path}
          aria-current={pathname === destination.path ? 'page' : undefined}
        />
      ))}
    </BottomNavigation>
  );
};
