import type { BaseUnit } from '../../../domain/inventory/types';
import type { IngredientDisplayUnit } from '../types/ingredientDisplay';

export const UNIT_KEY_BY_BASE_UNIT: Partial<Record<BaseUnit, IngredientDisplayUnit>> = {
  gram: 'gram',
  milliliter: 'milliliter',
  piece: 'piece',
};
