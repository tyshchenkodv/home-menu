import type { MenuDishView } from './menuDishView';

export interface DishAvailabilityCardProps {
  view: MenuDishView;
  onReserve: (view: MenuDishView) => void;
  onRequestCooking: (view: MenuDishView) => void;
  /** Signed-in user's own summed reserved-quantity for this exact dish/date/meal slot; hidden when 0 or undefined. */
  reservedQuantity?: number;
  /** Signed-in user's own summed active-cook-request quantity for this exact slot; hidden when 0 or undefined. */
  requestedQuantity?: number;
}
