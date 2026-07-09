import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { InventoryTab } from './inventoryTab';

export interface IngredientCardProps {
  ingredient: IngredientWithId;
  tab: InventoryTab;
  onEdit: (ingredient: IngredientWithId) => void;
  onArchive: (ingredient: IngredientWithId) => void;
  onRestore: (ingredient: IngredientWithId) => void;
  onRestock: (ingredient: IngredientWithId) => void;
  onCorrect: (ingredient: IngredientWithId) => void;
  onMarkPresent: (ingredient: IngredientWithId) => void;
  onMarkAbsent: (ingredient: IngredientWithId) => void;
}
