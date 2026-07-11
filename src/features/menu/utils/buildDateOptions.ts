import type { CalendarDate } from '../../../domain/orders/types';
import type { CalendarDateOption } from '../types/calendarDateOption';

const ORDERABLE_WINDOW_DAYS = 7;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** Stable `YYYY-MM-DD` key for a `CalendarDate`, used for React keys and equality checks. */
export function calendarDateKey(date: CalendarDate): string {
  return `${String(date.year)}-${pad2(date.month)}-${pad2(date.day)}`;
}

/** Converts a UTC epoch-millis instant into the `CalendarDate` it falls on, in `timeZone`. */
export function toCalendarDate(utcMillis: number, timeZone: string): CalendarDate {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(utcMillis));
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value ?? '0');

  return { year: value('year'), month: value('month'), day: value('day') };
}

/**
 * Builds the SPEC "Domain and data model" rule 2 menu date window: today
 * through today + 7 days inclusive (8 selectable pills).
 */
export function buildDateOptions(today: CalendarDate): CalendarDateOption[] {
  const todayUtcMidnight = Date.UTC(today.year, today.month - 1, today.day);

  return Array.from({ length: ORDERABLE_WINDOW_DAYS + 1 }, (_unused, offset) => {
    const millis = todayUtcMidnight + offset * MILLIS_PER_DAY;
    const date: CalendarDate = {
      year: new Date(millis).getUTCFullYear(),
      month: new Date(millis).getUTCMonth() + 1,
      day: new Date(millis).getUTCDate(),
    };

    return { date, key: calendarDateKey(date) };
  });
}
