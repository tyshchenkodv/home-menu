import { describe, expect, it } from 'vitest';
import { BatchDomainError } from '../errors';
import type { PreparedBatch } from '../types';
import { assertBatchConservation } from '../batchInvariants';

function makeBatch(overrides: Partial<PreparedBatch> = {}): PreparedBatch {
  return {
    dishId: 'dish-1',
    dishName: 'Pancakes',
    producedQuantity: 10,
    availableQuantity: 4,
    reservedQuantity: 3,
    consumedQuantity: 2,
    discardedQuantity: 1,
    preparedAt: { toMillis: () => 0 },
    expiresAt: null,
    status: 'available',
    sourceCookingRequestId: null,
    createdAt: { toMillis: () => 0 },
    createdBy: 'admin-1',
    updatedAt: { toMillis: () => 0 },
    updatedBy: 'admin-1',
    ...overrides,
  };
}

function expectCode(fn: () => void, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(BatchDomainError);
    expect((error as BatchDomainError).code).toBe(code);
    return;
  }
  throw new Error(`expected assertBatchConservation to throw ${code}`);
}

describe('assertBatchConservation', () => {
  it('accepts a batch whose counters sum to producedQuantity', () => {
    expect(() => {
      assertBatchConservation(makeBatch());
    }).not.toThrow();
  });

  it('rejects a batch whose counters do not sum to producedQuantity', () => {
    expectCode(() => {
      assertBatchConservation(makeBatch({ availableQuantity: 5 }));
    }, 'batch/conservation-violated');
  });

  it('rejects a negative availableQuantity', () => {
    expectCode(() => {
      assertBatchConservation(makeBatch({ availableQuantity: -1, producedQuantity: 5 }));
    }, 'batch/negative-counter');
  });

  it('rejects a negative reservedQuantity', () => {
    expectCode(() => {
      assertBatchConservation(makeBatch({ reservedQuantity: -1 }));
    }, 'batch/negative-counter');
  });

  it('rejects a negative consumedQuantity', () => {
    expectCode(() => {
      assertBatchConservation(makeBatch({ consumedQuantity: -1 }));
    }, 'batch/negative-counter');
  });

  it('rejects a negative discardedQuantity', () => {
    expectCode(() => {
      assertBatchConservation(makeBatch({ discardedQuantity: -1 }));
    }, 'batch/negative-counter');
  });

  it('rejects a negative producedQuantity', () => {
    expectCode(() => {
      assertBatchConservation(makeBatch({ producedQuantity: -1 }));
    }, 'batch/negative-counter');
  });
});
