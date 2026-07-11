/** The `counters/preparedBatchNumber` document shape: the highest batch number allocated so far. */
export interface PreparedBatchNumberCounter {
  value: number;
}

/**
 * Computes the next global, monotonically increasing, gap-tolerant batch
 * number from the current counter snapshot data (or `null` if the counter
 * document does not exist yet — the first batch ever created). Pure so the
 * allocation step inside `orderTransactions.ts`'s two batch-creation
 * transactions is unit-testable without the emulator (see
 * `docs/specifications/batch-sequence-number/SPEC.md`).
 */
export function nextBatchNumber(counterData: PreparedBatchNumberCounter | null): number {
  return (counterData?.value ?? 0) + 1;
}
