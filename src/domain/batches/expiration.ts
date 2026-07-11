import type { DomainTimestamp } from './types';

const HOURS_UNTIL_EXPIRY_WARNING = 4;

/**
 * True when `expiresAt` is strictly before `now`, per `docs/04-business-logic.md`
 * "Expiration": `expiresAt < now` shows a warning to both roles. A batch with
 * no `expiresAt`, or one whose `expiresAt` is at or after `now`, is not
 * expired.
 */
export function isBatchExpired(expiresAt: DomainTimestamp | null, now: DomainTimestamp): boolean {
  if (expiresAt === null) {
    return false;
  }

  return expiresAt.toMillis() < now.toMillis();
}

/**
 * True when a batch will expire within `HOURS_UNTIL_EXPIRY_WARNING` hours
 * (4 hours by default per the screen spec), but has not yet expired.
 * Used for the "expiring soon" warning chip.
 */
export function isBatchExpiringSoon(
  expiresAt: DomainTimestamp | null,
  now: DomainTimestamp,
  hoursUntilWarning: number = HOURS_UNTIL_EXPIRY_WARNING,
): boolean {
  if (expiresAt === null) {
    return false;
  }

  const nowMillis = now.toMillis();
  const expiresAtMillis = expiresAt.toMillis();

  // Not expired yet: expiresAt >= now
  if (expiresAtMillis < nowMillis) {
    return false;
  }

  // Within warning window: expiresAt < now + hours
  const warningThresholdMillis = nowMillis + hoursUntilWarning * 60 * 60 * 1000;
  return expiresAtMillis < warningThresholdMillis;
}

/**
 * Computes the number of hours until expiry for display in the "expiring soon"
 * chip label. Returns 0 if already expired or if expiresAt is null.
 */
export function hoursUntilExpiry(expiresAt: DomainTimestamp | null, now: DomainTimestamp): number {
  if (expiresAt === null) {
    return 0;
  }

  const nowMillis = now.toMillis();
  const expiresAtMillis = expiresAt.toMillis();

  if (expiresAtMillis <= nowMillis) {
    return 0;
  }

  return Math.ceil((expiresAtMillis - nowMillis) / (60 * 60 * 1000));
}
