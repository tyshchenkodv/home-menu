import Stack from '@mui/material/Stack';

import type { MovementListProps } from '../../types/movementListProps';
import { MovementListItem } from './components/MovementListItem/MovementListItem';

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
