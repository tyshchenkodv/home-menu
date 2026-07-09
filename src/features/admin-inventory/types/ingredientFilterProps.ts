import type { IngredientWithId } from '../../../shared/types/ingredient';

export interface IngredientFilterProps {
  ingredients: IngredientWithId[];
  value: string;
  onChange: (ingredientId: string) => void;
}
