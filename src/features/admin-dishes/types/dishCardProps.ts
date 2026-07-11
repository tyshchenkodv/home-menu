import type { DishWithId } from '../../../shared/types/dish';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { DishesTab } from './dishesTab';

export interface DishCardProps {
  dish: DishWithId;
  tab: DishesTab;
  ingredients: IngredientWithId[];
  onEdit: (dish: DishWithId) => void;
  onArchive: (dish: DishWithId) => void;
  onRestore: (dish: DishWithId) => void;
}
