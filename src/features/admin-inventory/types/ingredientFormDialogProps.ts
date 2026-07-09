import type { IngredientFormInitialValues } from './ingredientFormInitialValues';
import type { IngredientFormMode } from './ingredientFormMode';
import type { IngredientFormSubmitPayload } from './ingredientFormSubmitPayload';

export interface IngredientFormDialogProps {
  open: boolean;
  mode: IngredientFormMode;
  initialValues: IngredientFormInitialValues;
  onCancel: () => void;
  onSubmit: (payload: IngredientFormSubmitPayload) => Promise<void>;
}
