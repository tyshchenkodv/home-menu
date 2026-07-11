import { helpTopicSections, quickStartSteps } from '../constants/helpContent';
import type { UserRole } from '../../../shared/types/userProfile';

/** Returns the quick-start steps visible to `role`, in declared order. */
export const selectQuickStartSteps = (role: UserRole) => quickStartSteps.filter(step => step.roles.includes(role));

/** Returns the Help topic sections visible to `role`, in declared order. */
export const selectHelpTopics = (role: UserRole) => helpTopicSections.filter(topic => topic.roles.includes(role));
