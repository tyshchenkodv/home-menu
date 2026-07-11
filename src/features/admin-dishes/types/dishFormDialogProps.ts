import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { DishFormInitialValues } from './dishFormInitialValues';
import type { DishFormMode } from './dishFormMode';
import type { DishFormSubmitPayload } from './dishFormSubmitPayload';

export interface DishFormDialogProps {
  open: boolean;
  mode: DishFormMode;
  initialValues: DishFormInitialValues;
  availableIngredients: IngredientWithId[];
  onCancel: () => void;
  onSubmit: (payload: DishFormSubmitPayload) => Promise<void>;
  onRequestArchive?: () => void;
}
