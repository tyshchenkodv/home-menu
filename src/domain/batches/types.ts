/**
 * Pure domain types for the prepared-batches foundation slice.
 *
 * This module must never import React, Firebase, Material UI, or the i18n library.
 * Firestore `Timestamp` is represented only through the generic
 * `DomainTimestamp` abstraction below, so this module stays framework-free
 * and infrastructure code can substitute its own concrete timestamp type.
 */

export type BatchStatus = 'available' | 'depleted' | 'discarded';

/**
 * Minimal structural abstraction over a persisted timestamp. Any type with a
 * `toMillis()` accessor satisfies this, including a Firestore `Timestamp`,
 * without the domain layer importing Firebase.
 */
export interface DomainTimestamp {
  toMillis(): number;
}

export interface PreparedBatch<TTimestamp = DomainTimestamp> {
  dishId: string;
  dishName: string;
  producedQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  consumedQuantity: number;
  discardedQuantity: number;
  preparedAt: TTimestamp;
  expiresAt: TTimestamp | null;
  status: BatchStatus;
  sourceCookingRequestId: string | null;
  createdAt: TTimestamp;
  createdBy: string;
  updatedAt: TTimestamp;
  updatedBy: string;
}

/** Minimal batch shape needed for FIFO allocation: an id, its available stock, and its age. */
export interface AllocatableBatch {
  batchId: string;
  availableQuantity: number;
  preparedAt: DomainTimestamp;
}

export interface BatchAllocation {
  batchId: string;
  quantity: number;
}
