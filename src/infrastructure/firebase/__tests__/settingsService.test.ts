import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Typed fake of the Firestore read/write boundary, mirroring the
 * `inventoryTransactions.test.ts` pattern: enough of the `firebase/firestore`
 * surface (`doc`, `getDoc`, `updateDoc`, `getFirestore`, `Timestamp`) for
 * `settingsService.ts` to exercise its real control flow while we assert on
 * the fake's spies.
 */
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDoc = vi.fn((...args: unknown[]) => {
  const ref = { __args: args, withConverter: vi.fn(() => ref) };
  return ref;
});
const mockGetFirestore = vi.fn(() => ({ __db: true }));
const mockTimestampNow = vi.fn(() => ({ __timestamp: true }));
const mockServerTimestamp = vi.fn(() => ({ __serverTimestamp: true }));

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  serverTimestamp: mockServerTimestamp,
  Timestamp: { now: mockTimestampNow },
}));

vi.mock('../firebaseApp', () => ({
  getFirebaseApp: vi.fn(() => ({ __app: true })),
}));

const { getGeneralSettings, updateGeneralSettings, DEFAULT_GENERAL_SETTINGS } =
  await import('../services/settingsService');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getGeneralSettings', () => {
  it('falls back to the documented defaults when settings/general does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined });

    const settings = await getGeneralSettings();

    expect(settings).toEqual(DEFAULT_GENERAL_SETTINGS);
    expect(settings.defaultMealTimes).toEqual({ breakfast: '08:00', lunch: '13:00', dinner: '19:00' });
    expect(settings.timezone).toBe('Europe/Kyiv');
  });

  it('returns the persisted meal times when the document exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        timezone: 'Europe/Kyiv',
        defaultMealTimes: { breakfast: '07:30', lunch: '12:30', dinner: '18:30' },
        updatedAt: { toMillis: () => 0 },
        updatedBy: 'admin-uid',
      }),
    });

    const settings = await getGeneralSettings();

    expect(settings).toEqual({
      timezone: 'Europe/Kyiv',
      defaultMealTimes: { breakfast: '07:30', lunch: '12:30', dinner: '18:30' },
    });
  });
});

describe('updateGeneralSettings', () => {
  it('writes settings/general with new meal times and a timestamp via setDoc (create-or-update)', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    const adminUid = 'test-admin-uid';

    await updateGeneralSettings(adminUid, {
      timezone: 'Europe/Kyiv',
      defaultMealTimes: { breakfast: '07:00', lunch: '12:00', dinner: '18:00' },
    });

    expect(mockSetDoc).toHaveBeenCalled();
    const writtenPayload = mockSetDoc.mock.calls[0]?.[1] as Record<string, unknown> | undefined;

    expect(writtenPayload?.timezone).toBe('Europe/Kyiv');
    expect(writtenPayload?.defaultMealTimes).toEqual({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
    });
    expect(writtenPayload?.updatedBy).toBe(adminUid);
    expect(writtenPayload?.updatedAt).toEqual({ __serverTimestamp: true });
    expect(mockServerTimestamp).toHaveBeenCalled();
  });
});
