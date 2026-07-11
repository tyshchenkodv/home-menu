import Stack from '@mui/material/Stack';

import type { DishListProps } from '../../types/dishListProps';
import { DishCard } from '../DishCard/DishCard';

/** Mobile-first stack of dish cards for the ready state. */
export const DishList = ({ dishes, tab, ingredients, onEdit, onArchive, onRestore }: DishListProps) => (
  <Stack spacing={1.5}>
    {dishes.map(dish => (
      <DishCard
        key={dish.id}
        dish={dish}
        tab={tab}
        ingredients={ingredients}
        onEdit={onEdit}
        onArchive={onArchive}
        onRestore={onRestore}
      />
    ))}
  </Stack>
);
