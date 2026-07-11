/**
 * Pure domain types for the inventory foundation slice.
 *
 * This module must never import React, Firebase, Material UI, or the i18n library.
 * Firestore `Timestamp` is represented only through the generic
 * `DomainTimestamp` abstraction below, so this module stays framework-free
 * and infrastructure code can substitute its own concrete timestamp type.
 */

/** Canonical persisted unit for an ingredient's stock. */
export type BaseUnit = 'piece' | 'gram' | 'milliliter' | 'presence';

/** Whether an ingredient is tracked as a countable quantity or a boolean presence. */
export type TrackingMode = 'quantity' | 'presence';

/** Movement kinds this slice may create. `cooking` and `archive_adjustment`
 * remain part of the documented vocabulary but are not produced here. */
export type MovementType = 'restock' | 'cooking' | 'correction' | 'archive_adjustment';

/** User-facing input unit before conversion to a canonical `BaseUnit`. */
export type InputUnit = 'g' | 'kg' | 'ml' | 'l' | 'pieces';

/**
 * Minimal structural abstraction over a persisted timestamp. Any type with a
 * `toMillis()` accessor satisfies this, including a Firestore `Timestamp`,
 * without the domain layer importing Firebase.
 */
export interface DomainTimestamp {
  toMillis(): number;
}

export interface Ingredient<TTimestamp = DomainTimestamp> {
  name: string;
  trackingMode: TrackingMode;
  baseUnit: BaseUnit;
  quantity: number | null;
  isPresent: boolean | null;
  lowStockThreshold: number | null;
  archivedAt: TTimestamp | null;
  createdAt: TTimestamp;
  createdBy: string;
  updatedAt: TTimestamp;
  updatedBy: string;
}

export interface InventoryMovement<TTimestamp = DomainTimestamp> {
  ingredientId: string;
  ingredientName: string;
  type: MovementType;
  deltaQuantity: number | null;
  presenceBefore: boolean | null;
  presenceAfter: boolean | null;
  balanceAfter: number | null;
  cookingRequestId: string | null;
  preparedBatchId: string | null;
  note: string | null;
  createdAt: TTimestamp;
  createdBy: string;
}
