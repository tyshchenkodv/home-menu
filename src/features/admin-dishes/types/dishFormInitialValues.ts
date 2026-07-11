import type { MealType } from '../../../domain/dishes/types';
import type { RecipeRowValue } from './recipeRowValue';

export interface DishFormInitialValues {
  name: string;
  description: string;
  mealTypes: MealType[];
  recipeRows: RecipeRowValue[];
}
