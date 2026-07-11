/**
 * Maximum number of destinations the bottom navigation shows inline. A role
 * whose destination count fits within this limit renders every destination
 * directly and skips the "More" sheet, even if some are flagged
 * `mobilePrimary: false` (a flag meant to trim a larger, admin-sized set).
 */
export const MOBILE_NAV_INLINE_LIMIT = 4;
