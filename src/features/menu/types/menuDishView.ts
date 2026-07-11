import type { DishAvailability } from '../../../domain/dishes/types';
import type { DishWithId } from '../../../shared/types/dish';

/** A dish paired with its live derived availability, ready for `DishAvailabilityCard`. */
export interface MenuDishView {
  dish: DishWithId;
  availability: DishAvailability;
}
