import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ingredient } from '../../../domain/inventory/types';

const ADMIN_UID = 'admin-uid';

/**
 * Typed fake of the Firestore transaction boundary. There is no Java runtime
 * available in this environment, so the emulator cannot run; the SPEC
 * explicitly allows a typed transaction fake in that case. The fake mimics
 * just enough of the `firebase/firestore` surface (`runTransaction`, `doc`,
 * `collection`, `Transaction.get/update/set`) for `inventoryTransactions.ts`
 * to exercise its real control flow while we assert on the fake's spies.
 */
const mockTransaction = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
};

const mockDoc = vi.fn((...args: unknown[]) => {
  const ref = {
    __args: args,
    withConverter: vi.fn(() => ref),
  };
  return ref;
});

const mockCollection = vi.fn((_db: unknown, path: string) => ({ __collection: path }));
const mockGetFirestore = vi.fn(() => ({ __db: true }));
const mockRunTransaction = vi.fn(async (_db: unknown, updateFunction: (tx: typeof mockTransaction) => Promise<void>) =>
  updateFunction(mockTransaction),
);
const mockTimestampNow = vi.fn(() => ({ toMillis: () => 1000 }) as never);
const mockServerTimestamp = vi.fn(() => ({ __serverTimestamp: true }) as never);

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  collection: mockCollection,
  doc: mockDoc,
  runTransaction: mockRunTransaction,
  serverTimestamp: mockServerTimestamp,
  Timestamp: { now: mockTimestampNow },
}));

vi.mock('../firebaseApp', () => ({
  getFirebaseApp: vi.fn(() => ({ __app: true })),
}));

const { restockIngredient, correctIngredientQuantity, markIngredientPresent, markIngredientAbsent } =
  await import('../services/inventoryTransactions');

const buildQuantityIngredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  name: 'Борошно',
  trackingMode: 'quantity',
  baseUnit: 'gram',
  quantity: 2000,
  isPresent: null,
  lowStockThreshold: 500,
  archivedAt: null,
  createdAt: { toMillis: () => 0 },
  createdBy: ADMIN_UID,
  updatedAt: { toMillis: () => 0 },
  updatedBy: ADMIN_UID,
  ...overrides,
});

const buildPresenceIngredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  name: 'Сіль',
  trackingMode: 'presence',
  baseUnit: 'presence',
  quantity: null,
  isPresent: false,
  lowStockThreshold: null,
  archivedAt: null,
  createdAt: { toMillis: () => 0 },
  createdBy: ADMIN_UID,
  updatedAt: { toMillis: () => 0 },
  updatedBy: ADMIN_UID,
  ...overrides,
});

const stubIngredientSnapshot = (ingredient: Ingredient | null) => {
  mockTransaction.get.mockResolvedValue({
    exists: () => ingredient !== null,
    data: () => ingredient,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRunTransaction.mockImplementation(
    async (_db: unknown, updateFunction: (tx: typeof mockTransaction) => Promise<void>) =>
      updateFunction(mockTransaction),
  );
});

describe('restockIngredient', () => {
  it('re-reads the ingredient, increases quantity, and writes exactly one restock movement', async () => {
    stubIngredientSnapshot(buildQuantityIngredient({ quantity: 2000 }));

    await restockIngredient('ingredient-1', 500, ADMIN_UID);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.get).toHaveBeenCalledTimes(1);

    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    const [, updatePatch] = mockTransaction.update.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(updatePatch.quantity).toBe(2500);
    expect(updatePatch.updatedBy).toBe(ADMIN_UID);

    expect(mockTransaction.set).toHaveBeenCalledTimes(1);
    const [, movement] = mockTransaction.set.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(movement).toMatchObject({
      ingredientId: 'ingredient-1',
      ingredientName: 'Борошно',
      type: 'restock',
      deltaQuantity: 500,
      balanceAfter: 2500,
      createdBy: ADMIN_UID,
      cookingRequestId: null,
      preparedBatchId: null,
    });
  });

  it('performs both writes inside the same runTransaction callback', async () => {
    stubIngredientSnapshot(buildQuantityIngredient({ quantity: 1000 }));

    await restockIngredient('ingredient-1', 250, ADMIN_UID);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    expect(mockTransaction.set).toHaveBeenCalledTimes(1);
  });

  it('rejects and writes nothing when the ingredient is archived', async () => {
    stubIngredientSnapshot(buildQuantityIngredient({ archivedAt: { toMillis: () => 1 } }));

    await expect(restockIngredient('ingredient-1', 100, ADMIN_UID)).rejects.toMatchObject({
      code: 'INGREDIENT_ARCHIVED',
    });

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('rejects and writes nothing when the ingredient does not exist', async () => {
    stubIngredientSnapshot(null);

    await expect(restockIngredient('missing', 100, ADMIN_UID)).rejects.toThrow();

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });
});

describe('correctIngredientQuantity', () => {
  it('sets the exact balance and records a correction movement with the reason as note', async () => {
    stubIngredientSnapshot(buildQuantityIngredient({ quantity: 2000 }));

    await correctIngredientQuantity('ingredient-1', 1800, 'Physical count mismatch', ADMIN_UID);

    const [, updatePatch] = mockTransaction.update.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(updatePatch.quantity).toBe(1800);

    const [, movement] = mockTransaction.set.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(movement).toMatchObject({
      type: 'correction',
      deltaQuantity: -200,
      balanceAfter: 1800,
      note: 'Physical count mismatch',
    });
  });

  it('rejects without writes when the reason is empty', async () => {
    stubIngredientSnapshot(buildQuantityIngredient({ quantity: 2000 }));

    await expect(correctIngredientQuantity('ingredient-1', 1800, '  ', ADMIN_UID)).rejects.toMatchObject({
      code: 'INVALID_REASON',
    });

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });
});

describe('markIngredientPresent', () => {
  it('marks presence true and records a restock movement with presence fields', async () => {
    stubIngredientSnapshot(buildPresenceIngredient({ isPresent: false }));

    await markIngredientPresent('ingredient-2', ADMIN_UID);

    const [, updatePatch] = mockTransaction.update.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(updatePatch.isPresent).toBe(true);

    const [, movement] = mockTransaction.set.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(movement).toMatchObject({
      type: 'restock',
      presenceBefore: false,
      presenceAfter: true,
      deltaQuantity: null,
      balanceAfter: null,
    });
  });
});

describe('markIngredientAbsent', () => {
  it('marks presence false and records a correction movement with presence fields', async () => {
    stubIngredientSnapshot(buildPresenceIngredient({ isPresent: true }));

    await markIngredientAbsent('ingredient-2', ADMIN_UID);

    const [, updatePatch] = mockTransaction.update.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(updatePatch.isPresent).toBe(false);

    const [, movement] = mockTransaction.set.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(movement).toMatchObject({
      type: 'correction',
      presenceBefore: true,
      presenceAfter: false,
      deltaQuantity: null,
      balanceAfter: null,
    });
  });

  it('rejects and writes nothing for an archived presence ingredient', async () => {
    stubIngredientSnapshot(buildPresenceIngredient({ archivedAt: { toMillis: () => 1 } }));

    await expect(markIngredientAbsent('ingredient-2', ADMIN_UID)).rejects.toMatchObject({
      code: 'INGREDIENT_ARCHIVED',
    });

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });
});
