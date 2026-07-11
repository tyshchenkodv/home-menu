import type { CalendarDate, MealType } from '../../../domain/orders/types';
import { calendarDateKey } from './buildDateOptions';

/** Single source of truth for the menu's operating timezone (Kyiv household). */
export const KYIV_TIME_ZONE = 'Europe/Kyiv';

/**
 * Builds the day+meal slot key used to match a menu card to the signed-in
 * user's own order holdings (see
 * `docs/specifications/menu-own-reservation-hint/SPEC.md` "Slot match is
 * day-level, not millisecond-level").
 */
export const buildSlotKey = (date: CalendarDate, mealType: MealType): string => {
  return `${calendarDateKey(date)}#${mealType}`;
};
