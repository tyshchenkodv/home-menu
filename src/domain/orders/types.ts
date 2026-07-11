/**
 * Pure domain types for the orders foundation slice.
 *
 * This module must never import React, Firebase, Material UI, or the i18n library.
 * Firestore `Timestamp` is represented only through the generic
 * `DomainTimestamp` abstraction below, so this module stays framework-free
 * and infrastructure code can substitute its own concrete timestamp type.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type OrderKind = 'ready' | 'cook';
export type OrderStatus =
  'reserved' | 'pending' | 'approved' | 'cooking' | 'prepared' | 'rejected' | 'cancelled' | 'consumed';

/**
 * Minimal structural abstraction over a persisted timestamp. Any type with a
 * `toMillis()` accessor satisfies this, including a Firestore `Timestamp`,
 * without the domain layer importing Firebase.
 */
export interface DomainTimestamp {
  toMillis(): number;
}

export interface OrderAllocation {
  batchId: string;
  quantity: number;
}

export interface Order<TTimestamp = DomainTimestamp> {
  userId: string;
  userDisplayName: string;
  dishId: string;
  dishName: string;
  kind: OrderKind;
  status: OrderStatus;
  quantity: number;
  mealType: MealType;
  scheduledFor: TTimestamp;
  allocations: OrderAllocation[];
  rejectionReason: string | null;
  preparedBatchId: string | null;
  /**
   * The prepared batch's sequential `batchNumber`, mirrored onto the order
   * at the same time `preparedBatchId` is set so the admin board can render
   * it without an extra join (see
   * `docs/specifications/batch-sequence-number/SPEC.md`). `null` until
   * prepared, and for orders prepared from a legacy (pre-numbering) batch.
   */
  preparedBatchNumber: number | null;
  createdAt: TTimestamp;
  createdBy: string;
  updatedAt: TTimestamp;
  updatedBy: string;
}

/** Actions that legally move an order between statuses (docs/04 "Cooking request lifecycle" and "Cancellation"). */
export type OrderTransitionAction =
  'approve' | 'reject' | 'startCooking' | 'completeCooking' | 'userCancel' | 'normalize' | 'adminCorrection';

/** A calendar date without a time component, used to build `scheduledFor` and validate the orderable window. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}
