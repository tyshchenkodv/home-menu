import type { SvgIconComponent } from '@mui/icons-material';

import type { UserRole } from '../../../types/userProfile';

/** Identifies which live count a destination's nav badge displays. */
export type NavBadgeKey = 'pendingRequests' | 'lowStock';

/** A single role-aware navigation entry rendered by the shell nav components. */
export interface NavigationDestination {
  key: string;
  path: string;
  labelKey: string;
  Icon: SvgIconComponent;
  roles: UserRole[];
  /** When set, the drawer item renders a count badge sourced from this key. */
  badgeKey?: NavBadgeKey;
}
