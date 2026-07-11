import type { InventoryMovementWithId } from '../../../shared/types/inventoryMovement';

export type UseInventoryMovementsStatus = 'loading' | 'error' | 'ready';

/** View model returned by the `useInventoryMovements` feature hook. */
export interface UseInventoryMovementsResult {
  status: UseInventoryMovementsStatus;
  movements: InventoryMovementWithId[];
  error: Error | null;
}
