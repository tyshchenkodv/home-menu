import type { Timestamp } from 'firebase/firestore';

import type { InventoryMovement } from '../../domain/inventory/types';

/**
 * Firestore-facing `inventoryMovements/{movementId}` document shape: the pure
 * domain `InventoryMovement<TTimestamp>` generic bound to the concrete
 * Firebase `Timestamp` type.
 */
export type InventoryMovementDoc = InventoryMovement<Timestamp>;

/** An `InventoryMovementDoc` paired with its Firestore document id. */
export type InventoryMovementWithId = InventoryMovementDoc & { id: string };
