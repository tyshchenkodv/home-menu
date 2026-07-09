import { Timestamp, collection, doc, getFirestore, runTransaction } from 'firebase/firestore';

import { InventoryDomainError } from '../../../domain/inventory/errors';
import { correctQuantity, markAbsent, markPresent, restockQuantity } from '../../../domain/inventory/movementCommands';
import type { Ingredient } from '../../../domain/inventory/types';
import type { IngredientPatch, MovementCommandResult } from '../../../domain/inventory/movementCommands';
import { ingredientConverter } from '../converters/ingredientConverter';
import { inventoryMovementConverter } from '../converters/inventoryMovementConverter';
import { getFirebaseApp } from '../firebaseApp';

const INGREDIENTS_COLLECTION = 'ingredients';
const MOVEMENTS_COLLECTION = 'inventoryMovements';

const getDb = () => getFirestore(getFirebaseApp());

/**
 * Applies an ingredient patch to a Firestore update, stamping `updatedAt`
 * and `updatedBy`. Extracted since `IngredientPatch` is a union of
 * `{ quantity }` or `{ isPresent }` and both branches need the same stamp.
 */
function toUpdatePayload(patch: IngredientPatch, uid: string, now: Timestamp) {
  return { ...patch, updatedAt: now, updatedBy: uid };
}

/**
 * Runs one of the four stock/presence mutation commands inside a single
 * Firestore transaction: re-reads the ingredient (so the transaction sees
 * the latest state, not whatever the caller had cached), re-validates the
 * requested change through the pure domain command (`buildResult`), then
 * writes the updated ingredient and the new append-only movement document
 * together. If the ingredient is missing or the domain command throws
 * (e.g. `INGREDIENT_ARCHIVED`), neither write happens and the rejection
 * propagates to the caller untouched.
 */
async function runIngredientTransaction(
  ingredientId: string,
  uid: string,
  buildResult: (ingredient: Ingredient<Timestamp>) => MovementCommandResult,
): Promise<void> {
  await runTransaction(getDb(), async transaction => {
    const ingredientRef = doc(getDb(), INGREDIENTS_COLLECTION, ingredientId).withConverter(ingredientConverter);
    const snapshot = await transaction.get(ingredientRef);

    if (!snapshot.exists()) {
      throw new InventoryDomainError('INVALID_NAME', `Ingredient ${ingredientId} does not exist`);
    }

    const ingredient = snapshot.data();
    const { movement, ingredientPatch } = buildResult(ingredient);

    const now = Timestamp.now();

    transaction.update(ingredientRef, toUpdatePayload(ingredientPatch, uid, now));

    const movementRef = doc(collection(getDb(), MOVEMENTS_COLLECTION)).withConverter(inventoryMovementConverter);
    transaction.set(movementRef, {
      ingredientId,
      ...movement,
      createdAt: now,
      createdBy: uid,
    });
  });
}

/** Restocks a quantity ingredient by `deltaQuantity` (positive, base unit). */
export const restockIngredient = (ingredientId: string, deltaQuantity: number, uid: string): Promise<void> =>
  runIngredientTransaction(ingredientId, uid, ingredient => restockQuantity(ingredient, deltaQuantity));

/** Sets a quantity ingredient to `exactBalance`, requiring a non-empty `reason`. */
export const correctIngredientQuantity = (
  ingredientId: string,
  exactBalance: number,
  reason: string,
  uid: string,
): Promise<void> =>
  runIngredientTransaction(ingredientId, uid, ingredient => correctQuantity(ingredient, exactBalance, reason));

/** Marks a presence ingredient present. */
export const markIngredientPresent = (ingredientId: string, uid: string): Promise<void> =>
  runIngredientTransaction(ingredientId, uid, ingredient => markPresent(ingredient));

/** Marks a presence ingredient absent. */
export const markIngredientAbsent = (ingredientId: string, uid: string): Promise<void> =>
  runIngredientTransaction(ingredientId, uid, ingredient => markAbsent(ingredient));
