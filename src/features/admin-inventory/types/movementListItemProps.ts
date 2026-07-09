import type { BaseUnit } from '../../../domain/inventory/types';
import type { InventoryMovementWithId } from '../../../shared/types/inventoryMovement';

export interface MovementListItemProps {
  movement: InventoryMovementWithId;
  /** The ingredient's current base unit, looked up by `movement.ingredientId`, or `null` when unresolvable. */
  baseUnit: BaseUnit | null;
}
