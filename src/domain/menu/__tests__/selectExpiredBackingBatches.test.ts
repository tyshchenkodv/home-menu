import { describe, expect, it } from 'vitest';

import type { DomainTimestamp, PreparedBatch } from '../../batches/types';
import { selectExpiredBackingBatches } from '../selectExpiredBackingBatches';

const timestamp = (millis: number): DomainTimestamp => ({ toMillis: () => millis });

const NOW = timestamp(1_000);

const buildBatch = (overrides: Partial<PreparedBatch> = {}): PreparedBatch => ({
  dishId: 'dish-1',
  dishName: 'Dish',
  batchNumber: 1,
  producedQuantity: 1,
  availableQuantity: 1,
  reservedQuantity: 0,
  consumedQuantity: 0,
  discardedQuantity: 0,
  preparedAt: timestamp(0),
  expiresAt: timestamp(500),
  status: 'available',
  sourceCookingRequestId: null,
  createdAt: timestamp(0),
  createdBy: 'admin',
  updatedAt: timestamp(0),
  updatedBy: 'admin',
  ...overrides,
});

describe('selectExpiredBackingBatches', () => {
  it('returns an empty array when there are no batches', () => {
    expect(selectExpiredBackingBatches([], NOW)).toEqual([]);
  });

  it('returns an empty array when no batch is expired', () => {
    const batches = [buildBatch({ expiresAt: timestamp(2_000) }), buildBatch({ expiresAt: null })];

    expect(selectExpiredBackingBatches(batches, NOW)).toEqual([]);
  });

  it('returns an expired, non-discarded batch', () => {
    const expired = buildBatch({ expiresAt: timestamp(500), status: 'available' });

    expect(selectExpiredBackingBatches([expired], NOW)).toEqual([expired]);
  });

  it('ignores an expired batch whose status is discarded', () => {
    const discarded = buildBatch({ expiresAt: timestamp(500), status: 'discarded' });

    expect(selectExpiredBackingBatches([discarded], NOW)).toEqual([]);
  });

  it('keeps only the expired, non-discarded batches out of a mixed list', () => {
    const expiredAvailable = buildBatch({ expiresAt: timestamp(100), status: 'available' });
    const expiredDepleted = buildBatch({ expiresAt: timestamp(200), status: 'depleted' });
    const expiredDiscarded = buildBatch({ expiresAt: timestamp(300), status: 'discarded' });
    const notExpired = buildBatch({ expiresAt: timestamp(9_000), status: 'available' });

    expect(selectExpiredBackingBatches([expiredAvailable, expiredDepleted, expiredDiscarded, notExpired], NOW)).toEqual(
      [expiredAvailable, expiredDepleted],
    );
  });
});
