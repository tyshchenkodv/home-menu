import type {
  CreateIngredientInput,
  UpdateIngredientInput,
} from '../../../infrastructure/firebase/services/ingredientService';

/**
 * Resolved, validated payload an `IngredientFormDialog` submit produces. The
 * dialog itself performs client-side validation and unit conversion; the
 * caller only needs to route the payload to the matching service call.
 */
export type IngredientFormSubmitPayload =
  { mode: 'create'; input: CreateIngredientInput } | { mode: 'edit'; input: UpdateIngredientInput };
