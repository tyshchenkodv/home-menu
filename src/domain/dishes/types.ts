/**
 * Pure domain types for the dishes foundation slice.
 *
 * This module must never import React, Firebase, Material UI, or the i18n library.
 * Firestore `Timestamp` is represented only through the generic
 * `DomainTimestamp` abstraction below, so this module stays framework-free
 * and infrastructure code can substitute its own concrete timestamp type.
 */

/** Meal a dish may be offered for. */
export type MealType = 'breakfast' | 'lunch' | 'dinner';

/**
 * Minimal structural abstraction over a persisted timestamp. Any type with a
 * `toMillis()` accessor satisfies this, including a Firestore `Timestamp`,
 * without the domain layer importing Firebase.
 */
export interface DomainTimestamp {
  toMillis(): number;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  requiredQuantity: number | null;
  requiresPresence: boolean | null;
}

export interface Dish<TTimestamp = DomainTimestamp> {
  name: string;
  description: string;
  mealTypes: MealType[];
  recipeItems: RecipeItem[];
  archivedAt: TTimestamp | null;
  createdAt: TTimestamp;
  createdBy: string;
  updatedAt: TTimestamp;
  updatedBy: string;
}

/** Non-discarded prepared batch summary needed to compute ready portions. */
export interface AvailabilityBatch {
  status: 'available' | 'depleted' | 'discarded';
  availableQuantity: number;
}

/** Current ingredient stock snapshot needed to evaluate a recipe item. */
export interface AvailabilityIngredient {
  ingredientId: string;
  quantity: number | null;
  isPresent: boolean | null;
}

export interface MissingIngredient {
  ingredientId: string;
  shortage: number | null;
}

/** Derived availability for a dish, per `docs/03-data-model.md` "Derived availability". */
export interface DishAvailability {
  configured: boolean;
  readyQuantity: number;
  canCook: boolean;
  missingIngredients: MissingIngredient[];
}
