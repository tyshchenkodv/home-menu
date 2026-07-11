const KYIV_TIME_ZONE = 'Europe/Kyiv';

const toLocale = (language: string): string => (language === 'uk' ? 'uk-UA' : 'en-US');

/** Short weekday + day-of-month for an order's meta line, e.g. "Ср 9" / "Wed 9". */
export function formatOrderDate(millis: number, language: string): string {
  return new Intl.DateTimeFormat(toLocale(language), {
    weekday: 'short',
    day: 'numeric',
    timeZone: KYIV_TIME_ZONE,
  }).format(new Date(millis));
}

/** 24-hour "HH:mm" clock time, e.g. for "consumed 13:40" / "cancelled 13:40". */
export function formatOrderTime(millis: number, language: string): string {
  return new Intl.DateTimeFormat(toLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: KYIV_TIME_ZONE,
  }).format(new Date(millis));
}
