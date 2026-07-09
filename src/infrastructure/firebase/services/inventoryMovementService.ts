import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import type { InventoryMovementDoc, InventoryMovementWithId } from '../../../shared/types/inventoryMovement';
import { inventoryMovementConverter } from '../converters/inventoryMovementConverter';
import { getFirebaseApp } from '../firebaseApp';

const COLLECTION = 'inventoryMovements';

const getMovementsCollection = () => collection(getFirestore(getFirebaseApp()), COLLECTION);

export interface SubscribeMovementsOptions {
  /** Narrows the subscription to a single ingredient's history. */
  ingredientId?: string;
}

const mapSnapshot = (snapshot: QuerySnapshot<InventoryMovementDoc>): InventoryMovementWithId[] =>
  snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));

/**
 * Subscribes to append-only inventory movements ordered `createdAt DESC`,
 * optionally filtered to a single ingredient. The filtered shape matches the
 * `inventoryMovements: ingredientId ASC, createdAt DESC` composite index in
 * `firestore.indexes.json`.
 */
export const subscribeMovements = (
  { ingredientId }: SubscribeMovementsOptions,
  onNext: (movements: InventoryMovementWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const constraints = ingredientId ? [where('ingredientId', '==', ingredientId)] : [];

  const movementsQuery = query(
    getMovementsCollection().withConverter(inventoryMovementConverter),
    ...constraints,
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    movementsQuery,
    snapshot => {
      onNext(mapSnapshot(snapshot));
    },
    onError,
  );
};
