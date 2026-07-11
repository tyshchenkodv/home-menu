import type { CalendarDate } from '../../../domain/orders/types';

/** One selectable day pill in `DateMealSelector`: a calendar date plus its display label. */
export interface CalendarDateOption {
  date: CalendarDate;
  /** Stable key, `YYYY-MM-DD`, used for React keys and equality checks. */
  key: string;
}
