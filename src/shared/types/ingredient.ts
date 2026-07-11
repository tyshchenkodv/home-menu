import type { Timestamp } from 'firebase/firestore';

import type { Ingredient } from '../../domain/inventory/types';

/**
 * Firestore-facing `ingredients/{ingredientId}` document shape: the pure
 * domain `Ingredient<TTimestamp>` generic bound to the concrete Firebase
 * `Timestamp` type. This is the only place the domain shape and Firebase are
 * wired together; `src/domain/**` itself stays framework-free.
 */
export type IngredientDoc = Ingredient<Timestamp>;

/** An `IngredientDoc` paired with its Firestore document id. */
export type IngredientWithId = IngredientDoc & { id: string };
