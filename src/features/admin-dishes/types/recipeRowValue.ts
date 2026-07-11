import type { InputUnit } from '../../../domain/inventory/types';

/**
 * One recipe row as edited in `DishFormDialog`, before conversion to a
 * persisted `RecipeItem`. `ingredientId` is `''` for an unfilled row.
 * `quantityText`/`inputUnit` are only meaningful when the selected
 * ingredient tracks quantity; a presence-tracked ingredient needs neither.
 */
export interface RecipeRowValue {
  key: string;
  ingredientId: string;
  quantityText: string;
  inputUnit: InputUnit;
}

export const createEmptyRecipeRow = (key: string): RecipeRowValue => ({
  key,
  ingredientId: '',
  quantityText: '',
  inputUnit: 'g',
});
