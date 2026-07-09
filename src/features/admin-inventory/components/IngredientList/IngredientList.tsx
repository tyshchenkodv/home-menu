import Stack from '@mui/material/Stack';

import type { IngredientListProps } from '../../types/ingredientListProps';
import { IngredientCard } from './components/IngredientCard/IngredientCard';

/** Mobile-first stack of ingredient cards for the ready state. */
export const IngredientList = ({
  ingredients,
  tab,
  onEdit,
  onArchive,
  onRestore,
  onRestock,
  onCorrect,
  onMarkPresent,
  onMarkAbsent,
}: IngredientListProps) => (
  <Stack spacing={1.5}>
    {ingredients.map(ingredient => (
      <IngredientCard
        key={ingredient.id}
        ingredient={ingredient}
        tab={tab}
        onEdit={onEdit}
        onArchive={onArchive}
        onRestore={onRestore}
        onRestock={onRestock}
        onCorrect={onCorrect}
        onMarkPresent={onMarkPresent}
        onMarkAbsent={onMarkAbsent}
      />
    ))}
  </Stack>
);
