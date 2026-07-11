import { DishDomainError, type DishErrorCode } from '../../domain/dishes/errors';

const CODE_TO_TRANSLATION_KEY: Record<DishErrorCode, string> = {
  'dish/invalid-name': 'validation.required',
  'dish/incomplete-recipe-item': 'validation.incompleteRecipeRow',
  'dish/meal-type-required': 'validation.mealTypeRequired',
};

/**
 * Maps a thrown error to a translation key for display. `DishDomainError`
 * codes map to their dedicated validation message; anything else (network
 * failures, infrastructure errors) falls back to the generic error message
 * so the domain layer never has to know about i18n.
 */
export function resolveErrorTranslationKey(error: unknown): string {
  if (error instanceof DishDomainError) {
    return CODE_TO_TRANSLATION_KEY[error.code];
  }

  return 'common.error';
}
