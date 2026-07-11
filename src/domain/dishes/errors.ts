/**
 * Stable, locale-independent error codes for the dishes domain layer.
 * Presentation code maps these to translation keys; domain code never returns
 * Ukrainian or English prose (see docs/04-business-logic.md, "Localization
 * boundary").
 */
export type DishErrorCode = 'dish/invalid-name' | 'dish/incomplete-recipe-item' | 'dish/meal-type-required';

export class DishDomainError extends Error {
  readonly code: DishErrorCode;

  constructor(code: DishErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'DishDomainError';
    this.code = code;
  }
}
