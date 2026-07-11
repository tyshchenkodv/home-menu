import { OrderDomainError } from './errors';
import type { CalendarDate } from './types';

const KYIV_TIME_ZONE = 'Europe/Kyiv';
const MEAL_TIME_PATTERN = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
const ORDERABLE_WINDOW_DAYS = 7;
const MIN_ORDER_QUANTITY = 1;
const MAX_ORDER_QUANTITY = 99;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns the UTC offset (in milliseconds) that `timeZone` observes at the
 * instant `utcMillis`, computed via `Intl.DateTimeFormat` so this module
 * needs no timezone-data dependency.
 */
function timeZoneOffsetMillis(utcMillis: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(new Date(utcMillis));
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value ?? '0');

  const asIfUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );

  return asIfUtc - utcMillis;
}

/** Converts a local wall-clock date/time in `timeZone` to a UTC epoch-millis instant. */
function zonedTimeToUtcMillis(date: CalendarDate, hour: number, minute: number, timeZone: string): number {
  const guessUtc = Date.UTC(date.year, date.month - 1, date.day, hour, minute, 0);
  const offset = timeZoneOffsetMillis(guessUtc, timeZone);
  const refinedOffset = timeZoneOffsetMillis(guessUtc - offset, timeZone);

  return guessUtc - refinedOffset;
}

/**
 * Builds the UTC epoch-millis instant for `date` at `mealTime` ("HH:mm") in
 * `Europe/Kyiv`, per SPEC "Domain and data model" rule 2 and
 * `docs/03-data-model.md` `settings/general.timezone`. Throws
 * `order/invalid-meal-time` for a malformed time string.
 */
export function buildScheduledForMillis(date: CalendarDate, mealTime: string): number {
  const match = MEAL_TIME_PATTERN.exec(mealTime);
  if (!match) {
    throw new OrderDomainError('order/invalid-meal-time', `Meal time must be "HH:mm", got: ${mealTime}`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  return zonedTimeToUtcMillis(date, hour, minute, KYIV_TIME_ZONE);
}

/**
 * True when `selected` falls within `today..today + 7` inclusive, per SPEC
 * "Domain and data model" rule 2 (the menu date-selection window).
 */
export function isDateWithinOrderableWindow(selected: CalendarDate, today: CalendarDate): boolean {
  const selectedUtc = Date.UTC(selected.year, selected.month - 1, selected.day);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  const diffDays = Math.round((selectedUtc - todayUtc) / MILLIS_PER_DAY);

  return diffDays >= 0 && diffDays <= ORDERABLE_WINDOW_DAYS;
}

/** True when `quantity` is an integer within the SPEC rule 3 bounds (1..99). */
export function isValidOrderQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= MIN_ORDER_QUANTITY && quantity <= MAX_ORDER_QUANTITY;
}
