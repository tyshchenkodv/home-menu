import type { SvgIconComponent } from '@mui/icons-material';

import type { UserRole } from '../../../types/userProfile';

/** A single role-aware navigation entry rendered by the shell nav components. */
export interface NavigationDestination {
  key: string;
  path: string;
  labelKey: string;
  Icon: SvgIconComponent;
  roles: UserRole[];
  mobilePrimary: boolean;
}
