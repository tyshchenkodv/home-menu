import Stack from '@mui/material/Stack';

import type { BaseUnit } from '../../../domain/inventory/types';
import type { InventoryMovementWithId } from '../../../shared/types/inventoryMovement';
import { MovementListItem } from './MovementListItem';

interface MovementListProps {
  movements: InventoryMovementWithId[];
  /** Maps an ingredient id to its current base unit, for formatting quantity movements. */
  baseUnitByIngredientId: ReadonlyMap<string, BaseUnit>;
}

/** Mobile-first stack of movement cards for the ready state. */
export const MovementList = ({ movements, baseUnitByIngredientId }: MovementListProps) => (
  <Stack spacing={1.5}>
    {movements.map(movement => (
      <MovementListItem
        key={movement.id}
        movement={movement}
        baseUnit={baseUnitByIngredientId.get(movement.ingredientId) ?? null}
      />
    ))}
  </Stack>
);
