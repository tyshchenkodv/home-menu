import { BatchDomainError } from './errors';
import type { PreparedBatch } from './types';

/**
 * Asserts the `docs/03-data-model.md` "Conservation invariant" for a
 * prepared batch: `producedQuantity == availableQuantity + reservedQuantity +
 * consumedQuantity + discardedQuantity`, and that no counter is negative
 * (`docs/04` core invariant 4). Throws a `BatchDomainError` with a stable
 * error code on the first violation found.
 */
export function assertBatchConservation(batch: PreparedBatch): void {
  const counters: [string, number][] = [
    ['producedQuantity', batch.producedQuantity],
    ['availableQuantity', batch.availableQuantity],
    ['reservedQuantity', batch.reservedQuantity],
    ['consumedQuantity', batch.consumedQuantity],
    ['discardedQuantity', batch.discardedQuantity],
  ];

  for (const [name, value] of counters) {
    if (value < 0) {
      throw new BatchDomainError('batch/negative-counter', `${name} must not be negative`);
    }
  }

  const sum = batch.availableQuantity + batch.reservedQuantity + batch.consumedQuantity + batch.discardedQuantity;
  if (sum !== batch.producedQuantity) {
    throw new BatchDomainError(
      'batch/conservation-violated',
      `producedQuantity (${String(batch.producedQuantity)}) must equal the sum of the other counters (${String(sum)})`,
    );
  }
}
