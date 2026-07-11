import type { MenuDishView } from './menuDishView';

export interface DishAvailabilityCardProps {
  view: MenuDishView;
  onReserve: (view: MenuDishView) => void;
  onRequestCooking: (view: MenuDishView) => void;
}
