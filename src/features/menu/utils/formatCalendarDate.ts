import type { CalendarDate } from '../../../domain/orders/types';

/**
 * Formats a `CalendarDate` as a short weekday + day label (e.g. "Пн, 13" /
 * "13 Mon"), driven by `i18n.language`. Shared so every menu-feature surface
 * that restates the selected date — the `DateMealSelector` date chips and
 * the `CookingRequestDialog` date+meal context line — renders identical,
 * locale-correct text without duplicating `Intl.DateTimeFormat` options.
 */
export function formatCalendarDateLabel(date: CalendarDate, language: string): string {
  const formatter = new Intl.DateTimeFormat(language, { weekday: 'short', day: 'numeric' });
  return formatter.format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}
