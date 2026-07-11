/**
 * Stable, locale-independent error codes for the prepared-batches domain
 * layer. Presentation code maps these to translation keys; domain code never
 * returns Ukrainian or English prose (see docs/04-business-logic.md,
 * "Localization boundary").
 */
export type BatchErrorCode =
  'batch/invalid-quantity' | 'batch/insufficient-available' | 'batch/negative-counter' | 'batch/conservation-violated';

export class BatchDomainError extends Error {
  readonly code: BatchErrorCode;

  constructor(code: BatchErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'BatchDomainError';
    this.code = code;
  }
}
