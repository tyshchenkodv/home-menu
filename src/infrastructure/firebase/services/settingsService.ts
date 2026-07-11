import { doc, getDoc, getFirestore, serverTimestamp, updateDoc, type WithFieldValue } from 'firebase/firestore';

import { getFirebaseApp } from '../firebaseApp';
import type { GeneralSettings, GeneralSettingsDoc } from '../../../shared/types/generalSettings';
import { generalSettingsConverter } from '../converters/generalSettingsConverter';

const COLLECTION = 'settings';
const DOCUMENT_ID = 'general';

/**
 * Default meal times per `docs/03-data-model.md` `settings/general` and
 * `docs/design/i18n-catalog.md` (`settings.mealTimes.defaultsHelp`):
 * 08:00 breakfast, 13:00 lunch, 19:00 dinner, `Europe/Kyiv`. Used whenever the
 * singleton document has not been created yet.
 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  timezone: 'Europe/Kyiv',
  defaultMealTimes: {
    breakfast: '08:00',
    lunch: '13:00',
    dinner: '19:00',
  },
};

/**
 * Reads `settings/general`, falling back to `DEFAULT_GENERAL_SETTINGS` when
 * the document does not exist yet (an administrator has never saved the
 * meal-times form). Never throws for a missing document — only a genuine
 * Firestore read failure propagates.
 */
export const getGeneralSettings = async (): Promise<GeneralSettings> => {
  const settingsRef = doc(getFirestore(getFirebaseApp()), COLLECTION, DOCUMENT_ID).withConverter(
    generalSettingsConverter,
  );
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return DEFAULT_GENERAL_SETTINGS;
  }

  const data = snapshot.data();
  return { timezone: data.timezone, defaultMealTimes: data.defaultMealTimes };
};

/**
 * Updates `settings/general` with new default meal times. Creates the document
 * if it does not exist. Requires `activeAdmin()` per the Firestore rules matrix.
 */
export const updateGeneralSettings = async (
  userId: string,
  settings: Omit<GeneralSettingsDoc, 'updatedAt' | 'updatedBy'>,
): Promise<void> => {
  const settingsRef = doc(getFirestore(getFirebaseApp()), COLLECTION, DOCUMENT_ID).withConverter(
    generalSettingsConverter,
  );

  const payload: WithFieldValue<GeneralSettingsDoc> = {
    ...settings,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await updateDoc(settingsRef, payload as unknown as Record<string, unknown>);
};
