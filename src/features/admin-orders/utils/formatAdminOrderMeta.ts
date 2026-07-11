const KYIV_TIME_ZONE = 'Europe/Kyiv';

const toLocale = (language: string): string => (language === 'uk' ? 'uk-UA' : 'en-US');

/**
 * Short weekday + day-of-month for an admin order card's meta line, e.g.
 * "Ср 9" / "Wed 9". Deliberately duplicated from the `orders` feature's
 * identical helper rather than imported: `frontend-architecture` forbids
 * cross-feature imports of internal files.
 */
export function formatAdminOrderDate(millis: number, language: string): string {
  return new Intl.DateTimeFormat(toLocale(language), {
    weekday: 'short',
    day: 'numeric',
    timeZone: KYIV_TIME_ZONE,
  }).format(new Date(millis));
}
