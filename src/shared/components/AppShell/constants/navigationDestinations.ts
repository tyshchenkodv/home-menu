import Dashboard from '@mui/icons-material/Dashboard';
import Inventory2 from '@mui/icons-material/Inventory2';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import Settings from '@mui/icons-material/Settings';
import SoupKitchen from '@mui/icons-material/SoupKitchen';
import LocalDining from '@mui/icons-material/LocalDining';

import type { NavigationDestination } from '../types/navigationDestination';

/**
 * Every navigation destination in declared display order. `selectDestinations`
 * filters this list by role; order is preserved for both the drawer and the
 * bottom navigation.
 */
export const navigationDestinations: NavigationDestination[] = [
  {
    key: 'menu',
    path: '/menu',
    labelKey: 'nav.menu',
    Icon: RestaurantMenu,
    roles: ['admin', 'user'],
    mobilePrimary: true,
  },
  {
    key: 'orders',
    path: '/admin/orders',
    labelKey: 'nav.orders',
    Icon: ReceiptLong,
    roles: ['admin'],
    mobilePrimary: true,
  },
  {
    key: 'myOrders',
    path: '/orders',
    labelKey: 'nav.myOrders',
    Icon: ReceiptLong,
    roles: ['user'],
    mobilePrimary: true,
  },
  {
    key: 'admin',
    path: '/admin',
    labelKey: 'nav.admin',
    Icon: Dashboard,
    roles: ['admin'],
    mobilePrimary: true,
  },
  {
    key: 'inventory',
    path: '/admin/inventory',
    labelKey: 'nav.inventory',
    Icon: Inventory2,
    roles: ['admin'],
    mobilePrimary: false,
  },
  {
    key: 'batches',
    path: '/admin/batches',
    labelKey: 'nav.batches',
    Icon: SoupKitchen,
    roles: ['admin'],
    mobilePrimary: false,
  },
  {
    key: 'dishes',
    path: '/admin/dishes',
    labelKey: 'nav.dishes',
    Icon: LocalDining,
    roles: ['admin'],
    mobilePrimary: false,
  },
  {
    key: 'settings',
    path: '/settings',
    labelKey: 'nav.settings',
    Icon: Settings,
    roles: ['admin', 'user'],
    mobilePrimary: false,
  },
];
