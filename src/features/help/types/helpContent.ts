import type { SvgIconComponent } from '@mui/icons-material';

import type { UserRole } from '../../../shared/types/userProfile';

/** A single quick-start step shown at the top of the Help page, filtered by role. */
export interface QuickStartStep {
  key: string;
  titleKey: string;
  bodyKey: string;
  roles: UserRole[];
}

/** A single expandable Help topic section, filtered by role. */
export interface HelpTopicSection {
  key: string;
  titleKey: string;
  descriptionKey: string;
  Icon: SvgIconComponent;
  roles: UserRole[];
}
