import type { MenuDishView } from './menuDishView';

export interface UseDishAvailabilityResult {
  status: 'loading' | 'ready' | 'error';
  views: MenuDishView[];
  error: Error | null;
}
