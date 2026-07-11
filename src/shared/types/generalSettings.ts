import type { Timestamp } from 'firebase/firestore';

/** Default meal times, "HH:mm" in `Europe/Kyiv`, per `docs/03-data-model.md`. */
export interface DefaultMealTimes {
  breakfast: string;
  lunch: string;
  dinner: string;
}

/** Firestore-facing `settings/general` document shape. */
export interface GeneralSettingsDoc {
  timezone: 'Europe/Kyiv';
  defaultMealTimes: DefaultMealTimes;
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * The settings view consumed by the application: the same shape as
 * `GeneralSettingsDoc` minus the write-audit fields, so callers that only
 * need the meal times (e.g. the menu date/meal selector) don't have to
 * fabricate `updatedAt`/`updatedBy` when the document is missing and
 * `settingsService.getGeneralSettings` falls back to defaults.
 */
export interface GeneralSettings {
  timezone: 'Europe/Kyiv';
  defaultMealTimes: DefaultMealTimes;
}
