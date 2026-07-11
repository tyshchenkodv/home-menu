import { navigationDestinations } from '../constants/navigationDestinations';
import type { NavigationDestination } from '../types/navigationDestination';
import type { UserRole } from '../../../types/userProfile';

/** Returns the navigation destinations visible to `role`, in declared order. */
export const selectDestinations = (role: UserRole): NavigationDestination[] =>
  navigationDestinations.filter(destination => destination.roles.includes(role));
