import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

import type { GeneralSettingsDoc } from '../../../shared/types/generalSettings';

/** Typed read/write mapping for the `settings/general` singleton document. */
export const generalSettingsConverter: FirestoreDataConverter<GeneralSettingsDoc> = {
  toFirestore(settings: GeneralSettingsDoc) {
    return settings;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): GeneralSettingsDoc {
    const data = snapshot.data(options);

    return {
      timezone: data.timezone as GeneralSettingsDoc['timezone'],
      defaultMealTimes: data.defaultMealTimes as GeneralSettingsDoc['defaultMealTimes'],
      updatedAt: data.updatedAt as Timestamp,
      updatedBy: data.updatedBy as string,
    };
  },
};
