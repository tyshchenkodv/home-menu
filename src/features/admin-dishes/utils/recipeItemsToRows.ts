import type { RecipeItem } from '../../../domain/dishes/types';
import type { InputUnit } from '../../../domain/inventory/types';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { RecipeRowValue } from '../types/recipeRowValue';

const BASE_UNIT_TO_INPUT_UNIT: Record<string, InputUnit> = {
  gram: 'g',
  milliliter: 'ml',
  piece: 'pieces',
};

let rowKeySequence = 0;
const nextRowKey = () => {
  rowKeySequence += 1;
  return `existing-row-${String(rowKeySequence)}`;
};

/**
 * Converts a persisted dish's recipe items into editable form rows for
 * `DishFormDialog`, displaying each quantity in the ingredient's own
 * canonical unit (no kg/l roll-up on load, unlike inventory's display
 * formatting — the form always starts from the exact persisted number).
 */
export function recipeItemsToRows(recipeItems: RecipeItem[], ingredients: IngredientWithId[]): RecipeRowValue[] {
  const ingredientsById = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));

  return recipeItems.map(item => {
    const ingredient = ingredientsById.get(item.ingredientId);
    const inputUnit = ingredient ? (BASE_UNIT_TO_INPUT_UNIT[ingredient.baseUnit] ?? 'g') : 'g';

    return {
      key: nextRowKey(),
      ingredientId: item.ingredientId,
      quantityText: item.requiredQuantity !== null ? String(item.requiredQuantity) : '',
      inputUnit,
    };
  });
}
