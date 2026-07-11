import type { CreateDishInput, UpdateDishInput } from '../../../infrastructure/firebase/services/dishService';

/**
 * Resolved, validated payload a `DishFormDialog` submit produces. The dialog
 * itself performs client-side validation and recipe-row conversion; the
 * caller only needs to route the payload to the matching service call.
 */
export type DishFormSubmitPayload =
  { mode: 'create'; input: CreateDishInput } | { mode: 'edit'; input: UpdateDishInput };
