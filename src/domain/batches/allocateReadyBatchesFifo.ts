import { BatchDomainError } from './errors';
import type { AllocatableBatch, BatchAllocation } from './types';

/**
 * Implements `docs/04-business-logic.md` "Reserving prepared food" steps 2–4:
 * allocate `requestedQuantity` FIFO by `preparedAt` (oldest first), spanning
 * as many batches as needed. Throws `batch/insufficient-available` if the
 * total available stock across all batches cannot cover the request.
 */
export function allocateReadyBatchesFifo(batches: AllocatableBatch[], requestedQuantity: number): BatchAllocation[] {
  if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
    throw new BatchDomainError('batch/invalid-quantity', 'requestedQuantity must be a positive integer');
  }

  const totalAvailable = batches.reduce((total, current) => total + current.availableQuantity, 0);
  if (totalAvailable < requestedQuantity) {
    throw new BatchDomainError(
      'batch/insufficient-available',
      `Requested ${String(requestedQuantity)} but only ${String(totalAvailable)} available`,
    );
  }

  const orderedByAge = [...batches].sort((a, b) => a.preparedAt.toMillis() - b.preparedAt.toMillis());

  const allocations: BatchAllocation[] = [];
  let remaining = requestedQuantity;

  for (const current of orderedByAge) {
    if (remaining <= 0) {
      break;
    }
    if (current.availableQuantity <= 0) {
      continue;
    }

    const quantity = Math.min(current.availableQuantity, remaining);
    allocations.push({ batchId: current.batchId, quantity });
    remaining -= quantity;
  }

  return allocations;
}
