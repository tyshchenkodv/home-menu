import { describe, expect, it } from 'vitest';

import { i18n } from '../../app/i18n';

/**
 * Formatting check for the order/admin-order portion counts converted to
 * i18next plural keys (`docs/specifications/mvp-audit-remediation/PLAN.md`
 * T5.1): 1 portion renders the singular Ukrainian/English form, 3 portions
 * renders the plural form, driven purely by `{{count}}` — no manual
 * pluralization at the call site.
 */
describe('orders portion plurals', () => {
  it('renders the Ukrainian singular/plural forms for a reservation meta line', async () => {
    await i18n.changeLanguage('uk');

    expect(i18n.t('orders.meta.reservation', { count: 1, date: 'Ср 9', meal: 'обід' })).toBe('1 порція · Ср 9, обід');
    expect(i18n.t('orders.meta.reservation', { count: 3, date: 'Ср 9', meal: 'обід' })).toBe('3 порції · Ср 9, обід');
  });

  it('renders the English singular/plural forms for a reservation meta line', async () => {
    await i18n.changeLanguage('en');

    expect(i18n.t('orders.meta.reservation', { count: 1, date: 'Wed 9', meal: 'lunch' })).toBe(
      'Reserved · 1 portion · Wed 9, lunch',
    );
    expect(i18n.t('orders.meta.reservation', { count: 3, date: 'Wed 9', meal: 'lunch' })).toBe(
      'Reserved · 3 portions · Wed 9, lunch',
    );

    await i18n.changeLanguage('uk');
  });
});
