import Stack from '@mui/material/Stack';

import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { InventoryTab } from '../types/inventoryTab';
import { IngredientCard } from './IngredientCard';

interface IngredientListProps {
  ingredients: IngredientWithId[];
  tab: InventoryTab;
  onEdit: (ingredient: IngredientWithId) => void;
  onArchive: (ingredient: IngredientWithId) => void;
  onRestore: (ingredient: IngredientWithId) => void;
  onRestock: (ingredient: IngredientWithId) => void;
  onCorrect: (ingredient: IngredientWithId) => void;
  onMarkPresent: (ingredient: IngredientWithId) => void;
  onMarkAbsent: (ingredient: IngredientWithId) => void;
}

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
