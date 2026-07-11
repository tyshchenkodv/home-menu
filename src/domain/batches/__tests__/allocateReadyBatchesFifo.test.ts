import { describe, expect, it } from 'vitest';
import { BatchDomainError } from '../errors';
import type { AllocatableBatch } from '../types';
import { allocateReadyBatchesFifo } from '../allocateReadyBatchesFifo';

function batch(batchId: string, availableQuantity: number, preparedAtMillis: number): AllocatableBatch {
  return { batchId, availableQuantity, preparedAt: { toMillis: () => preparedAtMillis } };
}

function expectCode(fn: () => void, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(BatchDomainError);
    expect((error as BatchDomainError).code).toBe(code);
    return;
  }
  throw new Error(`expected allocateReadyBatchesFifo to throw ${code}`);
}

describe('allocateReadyBatchesFifo', () => {
  it('allocates fully from a single batch when it has enough stock', () => {
    const batches = [batch('b1', 5, 100)];

    const allocations = allocateReadyBatchesFifo(batches, 3);

    expect(allocations).toEqual([{ batchId: 'b1', quantity: 3 }]);
  });

  it('allocates FIFO by preparedAt, oldest first', () => {
    const batches = [batch('newer', 5, 200), batch('older', 5, 100)];

    const allocations = allocateReadyBatchesFifo(batches, 3);

    expect(allocations).toEqual([{ batchId: 'older', quantity: 3 }]);
  });

  it('spans multiple batches in FIFO order when one is insufficient alone', () => {
    const batches = [batch('later', 10, 200), batch('earliest', 2, 50), batch('middle', 4, 100)];

    const allocations = allocateReadyBatchesFifo(batches, 5);

    expect(allocations).toEqual([
      { batchId: 'earliest', quantity: 2 },
      { batchId: 'middle', quantity: 3 },
    ]);
  });

  it('skips batches with zero available quantity', () => {
    const batches = [batch('empty', 0, 50), batch('stocked', 4, 100)];

    const allocations = allocateReadyBatchesFifo(batches, 2);

    expect(allocations).toEqual([{ batchId: 'stocked', quantity: 2 }]);
  });

  it('throws batch/insufficient-available when total stock is too low', () => {
    const batches = [batch('b1', 2, 100), batch('b2', 1, 200)];

    expectCode(() => allocateReadyBatchesFifo(batches, 10), 'batch/insufficient-available');
  });

  it('throws batch/invalid-quantity for a zero or negative request', () => {
    const batches = [batch('b1', 5, 100)];

    for (const requested of [0, -1, 1.5]) {
      expectCode(() => allocateReadyBatchesFifo(batches, requested), 'batch/invalid-quantity');
    }
  });
});
