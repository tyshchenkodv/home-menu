/**
 * Formats a stored `batchNumber` (a positive, monotonically-allocated
 * integer — see `docs/specifications/batch-sequence-number/SPEC.md`) into
 * its zero-padded display token, e.g. `1` -> `'001'`, `42` -> `'042'`. Pads
 * to a minimum of 3 digits; numbers wider than 3 digits are never truncated.
 * Pure — the surrounding `#` and any locale copy belong to i18n callers.
 */
export function formatBatchNumber(batchNumber: number): string {
  return String(batchNumber).padStart(3, '0');
}
