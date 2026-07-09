import { InventoryDomainError } from './errors';
import type { Ingredient, MovementType } from './types';

/**
 * Fields needed to append an `inventoryMovements/{movementId}` document.
 * `ingredientId`, `createdAt`, and `createdBy` are infrastructure concerns
 * (Firestore doc id, server timestamp, authenticated uid) and are attached by
 * the transaction layer, not by these pure command builders.
 */
export interface MovementDraft {
  ingredientName: string;
  type: MovementType;
  deltaQuantity: number | null;
  presenceBefore: boolean | null;
  presenceAfter: boolean | null;
  balanceAfter: number | null;
  cookingRequestId: null;
  preparedBatchId: null;
  note: string | null;
}

/** The ingredient field(s) the transaction layer must persist alongside the movement. */
export type IngredientPatch = { quantity: number } | { isPresent: boolean };

export interface MovementCommandResult {
  movement: MovementDraft;
  ingredientPatch: IngredientPatch;
}

function assertNotArchived(ingredient: Ingredient): void {
  if (ingredient.archivedAt !== null) {
    throw new InventoryDomainError('INGREDIENT_ARCHIVED', 'Cannot record a movement for an archived ingredient');
  }
}

function assertQuantityMode(ingredient: Ingredient): asserts ingredient is Ingredient & { quantity: number } {
  if (ingredient.trackingMode !== 'quantity' || ingredient.quantity === null) {
    throw new InventoryDomainError('INVALID_TRACKING_MODE', 'This command requires a quantity-tracked ingredient');
  }
}

function assertPresenceMode(ingredient: Ingredient): void {
  if (ingredient.trackingMode !== 'presence' || typeof ingredient.isPresent !== 'boolean') {
    throw new InventoryDomainError('INVALID_TRACKING_MODE', 'This command requires a presence-tracked ingredient');
  }
}

/**
 * Records a positive quantity addition (restock). `deltaQuantity` must be a
 * finite positive number expressed in the ingredient's canonical base unit.
 */
export function restockQuantity(ingredient: Ingredient, deltaQuantity: number): MovementCommandResult {
  assertQuantityMode(ingredient);
  assertNotArchived(ingredient);

  if (typeof deltaQuantity !== 'number' || !Number.isFinite(deltaQuantity) || deltaQuantity <= 0) {
    throw new InventoryDomainError('INVALID_QUANTITY', 'restockQuantity requires a finite positive delta');
  }

  const balanceAfter = ingredient.quantity + deltaQuantity;

  return {
    movement: {
      ingredientName: ingredient.name,
      type: 'restock',
      deltaQuantity,
      presenceBefore: null,
      presenceAfter: null,
      balanceAfter,
      cookingRequestId: null,
      preparedBatchId: null,
      note: null,
    },
    ingredientPatch: { quantity: balanceAfter },
  };
}

/**
 * Sets a quantity ingredient to an exact observed balance, recording the
 * signed delta from its current quantity. Requires a non-empty reason.
 */
export function correctQuantity(ingredient: Ingredient, exactBalance: number, reason: string): MovementCommandResult {
  assertQuantityMode(ingredient);
  assertNotArchived(ingredient);

  if (typeof exactBalance !== 'number' || !Number.isFinite(exactBalance) || exactBalance < 0) {
    throw new InventoryDomainError('INVALID_QUANTITY', 'correctQuantity requires a finite exact balance >= 0');
  }

  if (typeof reason !== 'string' || reason.trim().length === 0) {
    throw new InventoryDomainError('INVALID_REASON', 'correctQuantity requires a non-empty reason');
  }

  const deltaQuantity = exactBalance - ingredient.quantity;

  return {
    movement: {
      ingredientName: ingredient.name,
      type: 'correction',
      deltaQuantity,
      presenceBefore: null,
      presenceAfter: null,
      balanceAfter: exactBalance,
      cookingRequestId: null,
      preparedBatchId: null,
      note: reason.trim(),
    },
    ingredientPatch: { quantity: exactBalance },
  };
}

/** Marks a presence ingredient present, recorded as a `restock` movement. */
export function markPresent(ingredient: Ingredient): MovementCommandResult {
  assertPresenceMode(ingredient);
  assertNotArchived(ingredient);

  return {
    movement: {
      ingredientName: ingredient.name,
      type: 'restock',
      deltaQuantity: null,
      presenceBefore: ingredient.isPresent,
      presenceAfter: true,
      balanceAfter: null,
      cookingRequestId: null,
      preparedBatchId: null,
      note: null,
    },
    ingredientPatch: { isPresent: true },
  };
}

/** Marks a presence ingredient absent, recorded as a `correction` movement. */
export function markAbsent(ingredient: Ingredient): MovementCommandResult {
  assertPresenceMode(ingredient);
  assertNotArchived(ingredient);

  return {
    movement: {
      ingredientName: ingredient.name,
      type: 'correction',
      deltaQuantity: null,
      presenceBefore: ingredient.isPresent,
      presenceAfter: false,
      balanceAfter: null,
      cookingRequestId: null,
      preparedBatchId: null,
      note: null,
    },
    ingredientPatch: { isPresent: false },
  };
}
