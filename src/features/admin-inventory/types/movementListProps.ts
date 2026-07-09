import type { BaseUnit } from '../../../domain/inventory/types';
import type { InventoryMovementWithId } from '../../../shared/types/inventoryMovement';

export interface MovementListProps {
  movements: InventoryMovementWithId[];
  /** Maps an ingredient id to its current base unit, for formatting quantity movements. */
  baseUnitByIngredientId: ReadonlyMap<string, BaseUnit>;
}
