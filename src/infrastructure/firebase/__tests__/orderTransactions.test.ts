import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER_UID = 'user-uid';
const DISH_ID = 'dish-risotto';

/**
 * Typed fake of the Firestore transaction boundary, mirroring
 * `inventoryTransactions.test.ts`: there is no Java runtime available in
 * this environment for `firebase emulators:exec`, and this suite runs under
 * the default (jsdom) vitest config rather than `vitest.rules.config.ts`, so
 * a live emulator round-trip is not wired up here either. The fake mimics
 * just enough of the `firebase/firestore` surface (`runTransaction`, `doc`,
 * `collection`, `query`/`where`/`orderBy`, `getDocs`,
 * `Transaction.get/update/set`) for `orderTransactions.ts` to exercise its
 * real control flow — including the FIFO allocation math from the real
 * `allocateReadyBatchesFifo` — while we assert on the fake's spies.
 *
 * The Firestore Web SDK's `Transaction.get()` only accepts a
 * `DocumentReference` (it cannot run a `Query`), so `reserveReadyOrder`
 * discovers candidate batch ids with a plain `getDocs` query first, then
 * re-reads each one by id inside the transaction. The fake mirrors that
 * two-step shape: `mockGetDocs` supplies the candidate ids, and
 * `mockTransaction.get` is queued dish-snapshot-first, then one entry per
 * candidate batch id, in query order.
 */
const mockTransaction = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
};

let refIdCounter = 0;
const mockDoc = vi.fn((...args: unknown[]) => {
  refIdCounter += 1;
  const ref = { __args: args, id: `generated-id-${String(refIdCounter)}`, withConverter: vi.fn(() => ref) };
  return ref;
});

const mockCollection = vi.fn((_db: unknown, path: string) => {
  const ref = { __collection: path, withConverter: vi.fn(() => ref) };
  return ref;
});
const mockQuery = vi.fn((...args: unknown[]) => ({ __query: args }));
const mockWhere = vi.fn((...args: unknown[]) => ({ __where: args }));
const mockOrderBy = vi.fn((...args: unknown[]) => ({ __orderBy: args }));
const mockGetDocs = vi.fn();
const mockGetFirestore = vi.fn(() => ({ __db: true }));
const mockRunTransaction = vi.fn(async (_db: unknown, updateFunction: (tx: typeof mockTransaction) => Promise<void>) =>
  updateFunction(mockTransaction),
);
const mockTimestampNow = vi.fn(() => ({ toMillis: () => 1_700_000_000_000 }) as never);
const mockTimestampFromMillis = vi.fn((millis: number) => ({ toMillis: () => millis }) as never);
const mockServerTimestamp = vi.fn(() => ({ __serverTimestamp: true }) as never);

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  collection: mockCollection,
  doc: mockDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  getDocs: mockGetDocs,
  runTransaction: mockRunTransaction,
  serverTimestamp: mockServerTimestamp,
  Timestamp: { now: mockTimestampNow, fromMillis: mockTimestampFromMillis },
}));

vi.mock('../firebaseApp', () => ({
  getFirebaseApp: vi.fn(() => ({ __app: true })),
}));

const { reserveReadyOrder, cancelOrder, OrderTransactionError } = await import('../services/orderTransactions');

interface FakeDish {
  name: string;
  recipeItems: unknown[];
}

interface FakeBatch {
  id: string;
  producedQuantity?: number;
  availableQuantity: number;
  reservedQuantity: number;
  consumedQuantity?: number;
  discardedQuantity?: number;
  preparedAt: { toMillis: () => number };
  status?: 'available' | 'depleted' | 'discarded';
}

const buildDish = (overrides: Partial<FakeDish> = {}): FakeDish => ({
  name: 'Mushroom risotto',
  recipeItems: [{ ingredientId: 'rice', ingredientName: 'Rice', requiredQuantity: 300, requiresPresence: null }],
  ...overrides,
});

const stubDishSnapshot = (dish: FakeDish | null) => ({
  exists: () => dish !== null,
  data: () => dish,
});

const stubBatchSnapshot = (batch: FakeBatch) => ({
  id: batch.id,
  exists: () => true,
  data: () => ({
    producedQuantity:
      batch.producedQuantity ??
      batch.availableQuantity + batch.reservedQuantity + (batch.consumedQuantity ?? 0) + (batch.discardedQuantity ?? 0),
    availableQuantity: batch.availableQuantity,
    reservedQuantity: batch.reservedQuantity,
    consumedQuantity: batch.consumedQuantity ?? 0,
    discardedQuantity: batch.discardedQuantity ?? 0,
    preparedAt: batch.preparedAt,
    status: batch.status ?? 'available',
  }),
});

const millis = (value: number) => ({ toMillis: () => value });

/** Queues the outer `getDocs` candidate lookup and the transaction reads (dish, then each batch) for one `reserveReadyOrder` call. */
function stubReservationRound(dish: FakeDish | null, batches: FakeBatch[]) {
  mockGetDocs.mockResolvedValueOnce({ docs: batches.map(batch => ({ id: batch.id })) });
  mockTransaction.get.mockResolvedValueOnce(stubDishSnapshot(dish));
  batches.forEach(batch => {
    mockTransaction.get.mockResolvedValueOnce(stubBatchSnapshot(batch));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  refIdCounter = 0;
  mockRunTransaction.mockImplementation(
    async (_db: unknown, updateFunction: (tx: typeof mockTransaction) => Promise<void>) =>
      updateFunction(mockTransaction),
  );
});

const baseInput = {
  dishId: DISH_ID,
  quantity: 4,
  mealType: 'lunch' as const,
  scheduledForMillis: 1_700_100_000_000,
  userId: USER_UID,
  userDisplayName: 'Test User',
};

describe('reserveReadyOrder', () => {
  it('allocates FIFO across two batches, moves both counters, and creates a reserved order', async () => {
    stubReservationRound(buildDish(), [
      { id: 'batch-older', availableQuantity: 2, reservedQuantity: 0, preparedAt: millis(100) },
      { id: 'batch-newer', availableQuantity: 3, reservedQuantity: 1, preparedAt: millis(200) },
    ]);

    const orderId = await reserveReadyOrder(baseInput);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    // dish + 2 batches
    expect(mockTransaction.get).toHaveBeenCalledTimes(3);

    expect(mockTransaction.update).toHaveBeenCalledTimes(2);
    const [olderRef, olderPatch] = mockTransaction.update.mock.calls[0] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    const [newerRef, newerPatch] = mockTransaction.update.mock.calls[1] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];

    expect(olderRef.__args).toContain('batch-older');
    expect(olderPatch).toMatchObject({ availableQuantity: 0, reservedQuantity: 2, status: 'depleted' });

    expect(newerRef.__args).toContain('batch-newer');
    expect(newerPatch).toMatchObject({ availableQuantity: 1, reservedQuantity: 3, status: 'available' });

    expect(mockTransaction.set).toHaveBeenCalledTimes(1);
    const [orderRef, order] = mockTransaction.set.mock.calls[0] as [{ id: string }, Record<string, unknown>];
    expect(order).toMatchObject({
      dishId: DISH_ID,
      dishName: 'Mushroom risotto',
      kind: 'ready',
      status: 'reserved',
      quantity: 4,
      mealType: 'lunch',
      userId: USER_UID,
      allocations: [
        { batchId: 'batch-older', quantity: 2 },
        { batchId: 'batch-newer', quantity: 2 },
      ],
    });

    expect(orderId).toBe(orderRef.id);
  });

  it('fails atomically with no writes when total available stock is insufficient', async () => {
    stubReservationRound(buildDish(), [
      { id: 'batch-1', availableQuantity: 1, reservedQuantity: 0, preparedAt: millis(100) },
    ]);

    await expect(reserveReadyOrder({ ...baseInput, quantity: 4 })).rejects.toMatchObject({
      code: 'batch/insufficient-available',
    });

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('fails atomically with no writes when the dish has an empty recipe (not configured)', async () => {
    stubReservationRound(buildDish({ recipeItems: [] }), []);

    await expect(reserveReadyOrder(baseInput)).rejects.toMatchObject({
      code: 'order/dish-not-configured',
    });

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('fails atomically with no writes when the dish does not exist', async () => {
    stubReservationRound(null, []);

    await expect(reserveReadyOrder(baseInput)).rejects.toBeInstanceOf(OrderTransactionError);
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('rejects a quantity outside the 1..99 domain bound before ever opening a transaction', async () => {
    await expect(reserveReadyOrder({ ...baseInput, quantity: 0 })).rejects.toMatchObject({
      code: 'order/invalid-quantity',
    });
    await expect(reserveReadyOrder({ ...baseInput, quantity: 100 })).rejects.toMatchObject({
      code: 'order/invalid-quantity',
    });

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('re-reads live counters on a later call, so a losing concurrent reservation sees fresher (lower) stock', async () => {
    // First reservation: 3 of 3 available portions succeed.
    stubReservationRound(buildDish(), [
      { id: 'batch-1', availableQuantity: 3, reservedQuantity: 0, preparedAt: millis(100) },
    ]);

    await reserveReadyOrder({ ...baseInput, quantity: 3 });
    expect(mockTransaction.set).toHaveBeenCalledTimes(1);

    // Second, concurrent-in-spirit reservation re-reads the transaction and
    // sees the batch already depleted by the first commit (0 available,
    // status flipped to 'depleted') — it fails instead of double-allocating
    // the same portions. The candidate lookup still finds the id (a stale
    // `getDocs` snapshot is exactly why the transaction re-reads by id).
    stubReservationRound(buildDish(), [
      { id: 'batch-1', availableQuantity: 0, reservedQuantity: 3, preparedAt: millis(100), status: 'depleted' },
    ]);

    await expect(reserveReadyOrder({ ...baseInput, quantity: 2 })).rejects.toMatchObject({
      code: 'batch/insufficient-available',
    });

    // Still exactly one successful order write across both attempts.
    expect(mockTransaction.set).toHaveBeenCalledTimes(1);
  });
});

interface FakeOrder {
  kind: 'ready' | 'cook';
  status: string;
  userId?: string;
  scheduledFor: { toMillis: () => number };
  allocations: { batchId: string; quantity: number }[];
}

const stubOrderSnapshot = (order: FakeOrder | null) => ({
  exists: () => order !== null,
  data: () => order,
});

/** Queues the transaction reads (order, then each allocated batch, in order) for one `cancelOrder` call. */
function stubCancelRound(order: FakeOrder | null, batches: FakeBatch[]) {
  mockTransaction.get.mockResolvedValueOnce(stubOrderSnapshot(order));
  batches.forEach(batch => {
    mockTransaction.get.mockResolvedValueOnce(stubBatchSnapshot(batch));
  });
}

const ORDER_ID = 'order-to-cancel';
const CANCEL_INPUT = { orderId: ORDER_ID, userId: USER_UID };

// `mockTimestampNow` (see the `firebase/firestore` mock above) always returns
// `toMillis() => 1_700_000_000_000`; scheduledFor values are chosen relative
// to that fixed "now".
const FUTURE_SCHEDULED_FOR = millis(1_700_100_000_000);
const PAST_SCHEDULED_FOR = millis(1_699_900_000_000);

const buildReadyOrder = (overrides: Partial<FakeOrder> = {}): FakeOrder => ({
  kind: 'ready',
  status: 'reserved',
  userId: USER_UID,
  scheduledFor: FUTURE_SCHEDULED_FOR,
  allocations: [
    { batchId: 'batch-a', quantity: 2 },
    { batchId: 'batch-b', quantity: 1 },
  ],
  ...overrides,
});

const buildCookOrder = (overrides: Partial<FakeOrder> = {}): FakeOrder => ({
  kind: 'cook',
  status: 'pending',
  userId: USER_UID,
  scheduledFor: FUTURE_SCHEDULED_FOR,
  allocations: [],
  ...overrides,
});

describe('cancelOrder', () => {
  it('restores allocations across two batches, moves both counters, and cancels a reserved order', async () => {
    stubCancelRound(buildReadyOrder(), [
      { id: 'batch-a', availableQuantity: 0, reservedQuantity: 2, preparedAt: millis(100) },
      { id: 'batch-b', availableQuantity: 3, reservedQuantity: 1, preparedAt: millis(200) },
    ]);

    await cancelOrder(CANCEL_INPUT);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    // order + 2 batches
    expect(mockTransaction.get).toHaveBeenCalledTimes(3);
    expect(mockTransaction.update).toHaveBeenCalledTimes(3);

    const [batchARef, batchAPatch] = mockTransaction.update.mock.calls[0] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    const [batchBRef, batchBPatch] = mockTransaction.update.mock.calls[1] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    const [orderRef, orderPatch] = mockTransaction.update.mock.calls[2] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];

    expect(batchARef.__args).toContain('batch-a');
    expect(batchAPatch).toMatchObject({ availableQuantity: 2, reservedQuantity: 0, status: 'available' });

    expect(batchBRef.__args).toContain('batch-b');
    expect(batchBPatch).toMatchObject({ availableQuantity: 4, reservedQuantity: 0, status: 'available' });

    expect(orderRef.__args).toContain(ORDER_ID);
    expect(orderPatch).toMatchObject({ status: 'cancelled', updatedBy: USER_UID });
  });

  it.each(['pending', 'approved'] as const)(
    'cancels a %s cooking request without touching any batch (no allocations to restore)',
    async status => {
      stubCancelRound(buildCookOrder({ status }), []);

      await cancelOrder(CANCEL_INPUT);

      expect(mockTransaction.get).toHaveBeenCalledTimes(1);
      expect(mockTransaction.update).toHaveBeenCalledTimes(1);
      const [orderRef, orderPatch] = mockTransaction.update.mock.calls[0] as [
        { __args: unknown[] },
        Record<string, unknown>,
      ];
      expect(orderRef.__args).toContain(ORDER_ID);
      expect(orderPatch).toMatchObject({ status: 'cancelled', updatedBy: USER_UID });
    },
  );

  it('rejects cancellation of a reserved order once now >= scheduledFor, with no writes', async () => {
    stubCancelRound(buildReadyOrder({ scheduledFor: PAST_SCHEDULED_FOR }), []);

    await expect(cancelOrder(CANCEL_INPUT)).rejects.toMatchObject({ code: 'order/cancel-not-allowed' });

    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it('rejects cancellation of a cooking request once it has reached "cooking", with no writes', async () => {
    stubCancelRound(buildCookOrder({ status: 'cooking' }), []);

    await expect(cancelOrder(CANCEL_INPUT)).rejects.toMatchObject({ code: 'order/cancel-not-allowed' });

    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it('fails with a domain error and no writes when the order does not exist', async () => {
    stubCancelRound(null, []);

    await expect(cancelOrder(CANCEL_INPUT)).rejects.toBeInstanceOf(OrderTransactionError);
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it('rejects cancellation when the order belongs to a different user, with no writes (defense in depth)', async () => {
    stubCancelRound(buildReadyOrder({ userId: 'someone-else' }), []);

    await expect(cancelOrder(CANCEL_INPUT)).rejects.toMatchObject({ code: 'order/not-owned' });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

const { approveRequest, rejectRequest, startCooking, completeCooking, correctOrder, normalizeConsumedOrders } =
  await import('../services/orderTransactions');
const { consumeOrder } = await import('../services/orderTransactions');

describe('consumeOrder', () => {
  it('moves reserved to consumed on every allocated batch and sets the order to consumed, regardless of scheduledFor', async () => {
    stubCancelRound(buildReadyOrder({ status: 'reserved', scheduledFor: FUTURE_SCHEDULED_FOR }), [
      { id: 'batch-a', availableQuantity: 0, reservedQuantity: 2, preparedAt: millis(100) },
      { id: 'batch-b', availableQuantity: 3, reservedQuantity: 1, preparedAt: millis(200) },
    ]);

    await consumeOrder({ orderId: ORDER_ID, adminUid: 'consume-admin-uid' });

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.get).toHaveBeenCalledTimes(3);
    expect(mockTransaction.update).toHaveBeenCalledTimes(3);

    const [batchARef, batchAPatch] = mockTransaction.update.mock.calls[0] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    const [batchBRef, batchBPatch] = mockTransaction.update.mock.calls[1] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    const [orderRef, orderPatch] = mockTransaction.update.mock.calls[2] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];

    expect(batchARef.__args).toContain('batch-a');
    expect(batchAPatch).toMatchObject({ reservedQuantity: 0, consumedQuantity: 2 });

    expect(batchBRef.__args).toContain('batch-b');
    expect(batchBPatch).toMatchObject({ reservedQuantity: 0, consumedQuantity: 1 });

    expect(orderRef.__args).toContain(ORDER_ID);
    expect(orderPatch).toMatchObject({ status: 'consumed', updatedBy: 'consume-admin-uid' });
  });

  it('consumes a prepared cook order with a single allocation', async () => {
    stubCancelRound(buildCookOrder({ status: 'prepared', allocations: [{ batchId: 'batch-c', quantity: 3 }] }), [
      { id: 'batch-c', availableQuantity: 0, reservedQuantity: 3, preparedAt: millis(100) },
    ]);

    await consumeOrder({ orderId: ORDER_ID, adminUid: 'consume-admin-uid' });

    expect(mockTransaction.update).toHaveBeenCalledTimes(2);
    const [, batchPatch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(batchPatch).toMatchObject({ reservedQuantity: 0, consumedQuantity: 3 });
  });

  it('rejects an order in any other status, with no writes', async () => {
    stubCancelRound(buildCookOrder({ status: 'pending' }), []);

    await expect(consumeOrder({ orderId: ORDER_ID, adminUid: 'consume-admin-uid' })).rejects.toMatchObject({
      code: 'order/invalid-transition',
    });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it('fails with a domain error and no writes when the order does not exist', async () => {
    stubCancelRound(null, []);

    await expect(consumeOrder({ orderId: ORDER_ID, adminUid: 'consume-admin-uid' })).rejects.toBeInstanceOf(
      OrderTransactionError,
    );
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

const ADMIN_UID = 'admin-uid';

describe('approveRequest', () => {
  it('moves a pending request to approved with no batch effect', async () => {
    stubCancelRound(buildCookOrder({ status: 'pending' }), []);

    await approveRequest(ORDER_ID, ADMIN_UID);

    expect(mockTransaction.get).toHaveBeenCalledTimes(1);
    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    const [orderRef, patch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(orderRef.__args).toContain(ORDER_ID);
    expect(patch).toMatchObject({ status: 'approved', updatedBy: ADMIN_UID });
  });

  it('fails atomically with an invalid-transition error when the request is not pending', async () => {
    stubCancelRound(buildCookOrder({ status: 'approved' }), []);

    await expect(approveRequest(ORDER_ID, ADMIN_UID)).rejects.toMatchObject({ code: 'order/invalid-transition' });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it('fails with a not-found error when the order does not exist', async () => {
    stubCancelRound(null, []);

    await expect(approveRequest(ORDER_ID, ADMIN_UID)).rejects.toMatchObject({ code: 'order/not-found' });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

describe('rejectRequest', () => {
  it('rejects a pending request and stores a trimmed reason', async () => {
    stubCancelRound(buildCookOrder({ status: 'pending' }), []);

    await rejectRequest({ orderId: ORDER_ID, adminUid: ADMIN_UID, reason: '  Out of flour  ' });

    const [, patch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(patch).toMatchObject({ status: 'rejected', rejectionReason: 'Out of flour', updatedBy: ADMIN_UID });
  });

  it('stores a null reason when none is given', async () => {
    stubCancelRound(buildCookOrder({ status: 'pending' }), []);

    await rejectRequest({ orderId: ORDER_ID, adminUid: ADMIN_UID });

    const [, patch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(patch).toMatchObject({ status: 'rejected', rejectionReason: null });
  });

  it('fails atomically when the request is already approved (frozen domain matrix only allows pending -> rejected)', async () => {
    stubCancelRound(buildCookOrder({ status: 'approved' }), []);

    await expect(rejectRequest({ orderId: ORDER_ID, adminUid: ADMIN_UID })).rejects.toMatchObject({
      code: 'order/invalid-transition',
    });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

describe('startCooking', () => {
  const START_COOKING_DISH_ID = 'dish-start-cooking';

  const buildApprovedCookOrder = (overrides: Record<string, unknown> = {}) => ({
    kind: 'cook',
    status: 'approved',
    dishId: START_COOKING_DISH_ID,
    quantity: 4,
    scheduledFor: FUTURE_SCHEDULED_FOR,
    allocations: [],
    ...overrides,
  });

  it('re-checks inventory and moves an approved request to cooking, without deducting or creating a batch', async () => {
    stubKeyedTransactionGet({
      orders: { [ORDER_ID]: buildApprovedCookOrder() as never },
      dishes: { [START_COOKING_DISH_ID]: RECIPE_DISH },
      ingredients: {
        rice: { name: 'Rice', quantity: 1000, isPresent: null },
        salt: { name: 'Salt', quantity: null, isPresent: true },
      },
    });

    await startCooking(ORDER_ID, ADMIN_UID);

    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    expect(mockTransaction.set).not.toHaveBeenCalled();
    const [orderRef, patch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(orderRef.__args).toContain(ORDER_ID);
    expect(patch).toMatchObject({ status: 'cooking', updatedBy: ADMIN_UID });
  });

  it('fails atomically with order/insufficient-inventory when an ingredient is short, with no writes', async () => {
    stubKeyedTransactionGet({
      orders: { [ORDER_ID]: buildApprovedCookOrder() as never },
      dishes: { [START_COOKING_DISH_ID]: RECIPE_DISH },
      ingredients: {
        rice: { name: 'Rice', quantity: 100, isPresent: null },
        salt: { name: 'Salt', quantity: null, isPresent: true },
      },
    });

    await expect(startCooking(ORDER_ID, ADMIN_UID)).rejects.toMatchObject({ code: 'order/insufficient-inventory' });
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('fails atomically when the request is still pending, without ever reading the dish', async () => {
    stubCancelRound(buildCookOrder({ status: 'pending' }), []);

    await expect(startCooking(ORDER_ID, ADMIN_UID)).rejects.toMatchObject({ code: 'order/invalid-transition' });
    expect(mockTransaction.get).toHaveBeenCalledTimes(1);
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it('fails atomically when the dish does not exist', async () => {
    stubKeyedTransactionGet({
      orders: { [ORDER_ID]: buildApprovedCookOrder() as never },
      dishes: {},
    });

    await expect(startCooking(ORDER_ID, ADMIN_UID)).rejects.toMatchObject({ code: 'order/dish-not-found' });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

interface FakeIngredient {
  name: string;
  quantity: number | null;
  isPresent: boolean | null;
}

/**
 * Keyed fake for `transaction.get`, used by `completeCooking`,
 * `correctOrder`, and `normalizeConsumedOrders`'s tests: unlike
 * `stubReservationRound`/`stubCancelRound`'s strict FIFO queue (fine for a
 * single sequential call), these functions' reads either fan out
 * (`Promise.all`) or run several transactions concurrently
 * (`normalizeConsumedOrders`), so resolution order is not guaranteed. This
 * looks up a canned response by the ref's `(collection, id)` args instead,
 * which is order-independent.
 */
function stubKeyedTransactionGet(byCollection: {
  orders?: Record<string, FakeOrder | null>;
  dishes?: Record<string, FakeDish | null>;
  ingredients?: Record<string, FakeIngredient | null>;
  preparedBatches?: Record<string, FakeBatch | null>;
  /** `counters/preparedBatchNumber`; defaults to absent (next allocation is 1) when omitted. */
  counters?: Record<string, { value: number } | null>;
}) {
  mockTransaction.get.mockImplementation(
    (ref: { __args: unknown[] }): Promise<{ exists: () => boolean; data: () => unknown }> => {
      const [, collectionPath, id] = ref.__args as [unknown, string, string];

      if (collectionPath === 'orders') {
        return Promise.resolve(stubOrderSnapshot(byCollection.orders?.[id] ?? null));
      }
      if (collectionPath === 'dishes') {
        return Promise.resolve(stubDishSnapshot(byCollection.dishes?.[id] ?? null));
      }
      if (collectionPath === 'ingredients') {
        const ingredient = byCollection.ingredients?.[id] ?? null;
        return Promise.resolve({ exists: () => ingredient !== null, data: () => ingredient });
      }
      if (collectionPath === 'preparedBatches') {
        const batch = byCollection.preparedBatches?.[id];
        return Promise.resolve(batch ? stubBatchSnapshot(batch) : { exists: () => false, data: () => null });
      }
      if (collectionPath === 'counters') {
        const counter = byCollection.counters?.[id] ?? null;
        return Promise.resolve({ exists: () => counter !== null, data: () => counter });
      }

      throw new Error(`Unexpected collection in test: ${collectionPath}`);
    },
  );
}

const COMPLETE_COOKING_ORDER_ID = 'order-cooking';
const COMPLETE_COOKING_DISH_ID = 'dish-risotto-recipe';

const buildCookingOrderFixture = (overrides: Record<string, unknown> = {}) => ({
  kind: 'cook',
  status: 'cooking',
  quantity: 4,
  dishId: COMPLETE_COOKING_DISH_ID,
  scheduledFor: FUTURE_SCHEDULED_FOR,
  allocations: [],
  ...overrides,
});

// Not typed as `FakeDish` (which only has the fields `reserveReadyOrder`'s
// tests need): `completeCooking` also calls `evaluateDishAvailability`,
// which requires `archivedAt`.
const RECIPE_DISH = {
  name: 'Mushroom risotto',
  archivedAt: null,
  recipeItems: [
    { ingredientId: 'rice', ingredientName: 'Rice', requiredQuantity: 300, requiresPresence: null },
    { ingredientId: 'salt', ingredientName: 'Salt', requiredQuantity: null, requiresPresence: true },
  ],
};

const baseCompleteCookingInput = {
  orderId: COMPLETE_COOKING_ORDER_ID,
  actualYield: 6,
  preparedAtMillis: 1_700_050_000_000,
  expiresAtMillis: 1_700_500_000_000,
  adminUid: ADMIN_UID,
};

describe('completeCooking', () => {
  it('deducts quantity ingredients, skips presence ones, creates a conserved batch, and prepares the order', async () => {
    stubKeyedTransactionGet({
      orders: { [COMPLETE_COOKING_ORDER_ID]: buildCookingOrderFixture() as never },
      dishes: { [COMPLETE_COOKING_DISH_ID]: RECIPE_DISH },
      ingredients: {
        rice: { name: 'Rice', quantity: 1000, isPresent: null },
        salt: { name: 'Salt', quantity: null, isPresent: true },
      },
    });

    const batchId = await completeCooking(baseCompleteCookingInput);

    // One ingredient update + one movement set (rice only) + one batch set +
    // one counter set + one order update.
    expect(mockTransaction.update).toHaveBeenCalledTimes(2);
    expect(mockTransaction.set).toHaveBeenCalledTimes(3);

    const [ingredientRef, ingredientPatch] = mockTransaction.update.mock.calls[0] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(ingredientRef.__args).toContain('rice');
    expect(ingredientPatch).toMatchObject({ quantity: 700 });

    const [movementRef, movement] = mockTransaction.set.mock.calls[0] as [unknown, Record<string, unknown>];
    void movementRef;
    expect(movement).toMatchObject({
      ingredientId: 'rice',
      type: 'cooking',
      deltaQuantity: -300,
      balanceAfter: 700,
      preparedBatchId: batchId,
      cookingRequestId: COMPLETE_COOKING_ORDER_ID,
    });

    const [, batch] = mockTransaction.set.mock.calls[1] as [unknown, Record<string, unknown>];
    expect(batch).toMatchObject({
      batchNumber: 1,
      producedQuantity: 6,
      availableQuantity: 2,
      reservedQuantity: 4,
      consumedQuantity: 0,
      discardedQuantity: 0,
      status: 'available',
      sourceCookingRequestId: COMPLETE_COOKING_ORDER_ID,
    });
    // Conservation: produced == available + reserved + consumed + discarded.
    expect((batch.availableQuantity as number) + (batch.reservedQuantity as number)).toBe(batch.producedQuantity);

    const [counterRef, counterPatch] = mockTransaction.set.mock.calls[2] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(counterRef.__args).toContain('counters');
    expect(counterPatch).toMatchObject({ value: 1 });

    const [orderRef, orderPatch] = mockTransaction.update.mock.calls[1] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(orderRef.__args).toContain(COMPLETE_COOKING_ORDER_ID);
    expect(orderPatch).toMatchObject({
      status: 'prepared',
      preparedBatchId: batchId,
      preparedBatchNumber: 1,
      allocations: [{ batchId, quantity: 4 }],
    });
  });

  it('fails atomically with no writes when the actual yield is below the requested quantity', async () => {
    mockTransaction.get.mockResolvedValueOnce(stubOrderSnapshot(buildCookingOrderFixture() as never));

    await expect(completeCooking({ ...baseCompleteCookingInput, actualYield: 3 })).rejects.toMatchObject({
      code: 'order/yield-below-requested',
    });
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
    // Only the order was ever read — the failure is detected before the dish/ingredient reads.
    expect(mockTransaction.get).toHaveBeenCalledTimes(1);
  });

  it('fails atomically with no writes when inventory cannot cover the recipe', async () => {
    stubKeyedTransactionGet({
      orders: { [COMPLETE_COOKING_ORDER_ID]: buildCookingOrderFixture() as never },
      dishes: { [COMPLETE_COOKING_DISH_ID]: RECIPE_DISH },
      ingredients: {
        rice: { name: 'Rice', quantity: 100, isPresent: null },
        salt: { name: 'Salt', quantity: null, isPresent: true },
      },
    });

    await expect(completeCooking(baseCompleteCookingInput)).rejects.toMatchObject({
      code: 'order/insufficient-inventory',
    });
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('rejects a yield outside the 1..99 domain bound before ever opening a transaction', async () => {
    await expect(completeCooking({ ...baseCompleteCookingInput, actualYield: 0 })).rejects.toMatchObject({
      code: 'order/invalid-yield',
    });
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('fails atomically when the order is not in the cooking status', async () => {
    mockTransaction.get.mockResolvedValueOnce(
      stubOrderSnapshot(buildCookingOrderFixture({ status: 'approved' }) as never),
    );

    await expect(completeCooking(baseCompleteCookingInput)).rejects.toMatchObject({
      code: 'order/invalid-transition',
    });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

describe('correctOrder', () => {
  const CORRECTION_INPUT = { orderId: ORDER_ID, adminUid: ADMIN_UID, reason: '  Batch spoiled  ' };

  it('requires a non-empty reason before ever opening a transaction', async () => {
    await expect(correctOrder({ ...CORRECTION_INPUT, reason: '   ' })).rejects.toMatchObject({
      code: 'order/correction-reason-required',
    });
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('cancels a prepared cook order, restores its allocation, and stores the trimmed reason', async () => {
    stubCancelRound(buildCookOrder({ status: 'prepared', allocations: [{ batchId: 'batch-a', quantity: 2 }] }), [
      { id: 'batch-a', availableQuantity: 1, reservedQuantity: 2, preparedAt: millis(100) },
    ]);

    await correctOrder(CORRECTION_INPUT);

    const [batchRef, batchPatch] = mockTransaction.update.mock.calls[0] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(batchRef.__args).toContain('batch-a');
    expect(batchPatch).toMatchObject({ availableQuantity: 3, reservedQuantity: 0, status: 'available' });

    const [, orderPatch] = mockTransaction.update.mock.calls[1] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(orderPatch).toMatchObject({ status: 'cancelled', rejectionReason: 'Batch spoiled' });
  });

  it('cancels a pending or approved cooking request with no allocation to restore', async () => {
    stubCancelRound(buildCookOrder({ status: 'pending' }), []);

    await correctOrder(CORRECTION_INPUT);

    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    const [, orderPatch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(orderPatch).toMatchObject({ status: 'cancelled', rejectionReason: 'Batch spoiled' });
  });

  it('fails atomically with no writes on an already-terminal order', async () => {
    stubCancelRound(buildCookOrder({ status: 'cancelled' }), []);

    await expect(correctOrder(CORRECTION_INPUT)).rejects.toMatchObject({ code: 'order/invalid-transition' });
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

describe('normalizeConsumedOrders', () => {
  const NOW_MILLIS = 1_700_200_000_000;

  it('is a no-op when no order is past its scheduled time', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    await normalizeConsumedOrders(NOW_MILLIS, ADMIN_UID);

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('normalizes a past-due reserved order: moves reserved to consumed on its batch and marks the order consumed', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'order-past-due' }] });
    stubKeyedTransactionGet({
      orders: {
        'order-past-due': {
          kind: 'ready',
          status: 'reserved',
          scheduledFor: PAST_SCHEDULED_FOR,
          allocations: [{ batchId: 'batch-a', quantity: 2 }],
        },
      },
      preparedBatches: {
        'batch-a': { id: 'batch-a', availableQuantity: 0, reservedQuantity: 2, preparedAt: millis(100) },
      },
    });

    await normalizeConsumedOrders(NOW_MILLIS, ADMIN_UID);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    const [batchRef, batchPatch] = mockTransaction.update.mock.calls[0] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(batchRef.__args).toContain('batch-a');
    expect(batchPatch).toMatchObject({ reservedQuantity: 0, consumedQuantity: 2 });

    const [orderRef, orderPatch] = mockTransaction.update.mock.calls[1] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(orderRef.__args).toContain('order-past-due');
    expect(orderPatch).toMatchObject({ status: 'consumed' });
  });

  it('is idempotent: a candidate that already normalized (raced by a concurrent call) is silently skipped', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'order-already-consumed' }] });
    stubKeyedTransactionGet({
      orders: {
        'order-already-consumed': {
          kind: 'ready',
          status: 'consumed',
          scheduledFor: PAST_SCHEDULED_FOR,
          allocations: [{ batchId: 'batch-a', quantity: 2 }],
        },
      },
    });

    await normalizeConsumedOrders(NOW_MILLIS, ADMIN_UID);

    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it('normalizes two eligible orders independently, one transaction each', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'order-1' }, { id: 'order-2' }] });
    stubKeyedTransactionGet({
      orders: {
        'order-1': {
          kind: 'ready',
          status: 'reserved',
          scheduledFor: PAST_SCHEDULED_FOR,
          allocations: [{ batchId: 'batch-1', quantity: 1 }],
        },
        'order-2': {
          kind: 'cook',
          status: 'prepared',
          scheduledFor: PAST_SCHEDULED_FOR,
          allocations: [{ batchId: 'batch-2', quantity: 3 }],
        },
      },
      preparedBatches: {
        'batch-1': { id: 'batch-1', availableQuantity: 0, reservedQuantity: 1, preparedAt: millis(100) },
        'batch-2': { id: 'batch-2', availableQuantity: 0, reservedQuantity: 3, preparedAt: millis(100) },
      },
    });

    await normalizeConsumedOrders(NOW_MILLIS, ADMIN_UID);

    expect(mockRunTransaction).toHaveBeenCalledTimes(2);
    expect(mockTransaction.update).toHaveBeenCalledTimes(4);
  });
});

const { discardBatch, registerBatch } = await import('../services/orderTransactions');

describe('discardBatch', () => {
  it('moves available quantity to discarded, asserts conservation, and updates the batch', async () => {
    const BATCH_ID = 'batch-discard-test';
    stubKeyedTransactionGet({
      preparedBatches: {
        [BATCH_ID]: {
          id: BATCH_ID,
          producedQuantity: 5,
          availableQuantity: 3,
          reservedQuantity: 2,
          consumedQuantity: 0,
          discardedQuantity: 0,
          preparedAt: millis(100),
          status: 'available',
        },
      },
    });

    await discardBatch({ batchId: BATCH_ID, adminUid: ADMIN_UID });

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.get).toHaveBeenCalledTimes(1);
    expect(mockTransaction.update).toHaveBeenCalledTimes(1);

    const [batchRef, patch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(batchRef.__args).toContain(BATCH_ID);
    expect(patch).toMatchObject({
      availableQuantity: 0,
      discardedQuantity: 3,
      updatedBy: ADMIN_UID,
      status: 'discarded', // docs/03 BatchStatus: discard always sets 'discarded', reserved portions untouched
    });
  });

  it('sets status to discarded even when reserved and consumed portions still remain on the batch', async () => {
    const BATCH_ID = 'batch-depleting';
    stubKeyedTransactionGet({
      preparedBatches: {
        [BATCH_ID]: {
          id: BATCH_ID,
          producedQuantity: 2,
          availableQuantity: 2,
          reservedQuantity: 0,
          consumedQuantity: 0,
          discardedQuantity: 0,
          preparedAt: millis(100),
          status: 'available',
        },
      },
    });

    await discardBatch({ batchId: BATCH_ID, adminUid: ADMIN_UID });

    const [, patch] = mockTransaction.update.mock.calls[0] as [{ __args: unknown[] }, Record<string, unknown>];
    expect(patch).toMatchObject({
      availableQuantity: 0,
      discardedQuantity: 2,
      status: 'discarded',
    });
  });

  it('fails atomically when the batch does not exist', async () => {
    stubKeyedTransactionGet({ preparedBatches: {} });

    await expect(discardBatch({ batchId: 'nonexistent', adminUid: ADMIN_UID })).rejects.toBeInstanceOf(
      OrderTransactionError,
    );
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

describe('registerBatch', () => {
  it('deducts quantity ingredients, creates a conserved batch with full available yield, skips presence items, and appends movements with null cookingRequestId', async () => {
    const REGISTER_DISH_ID = 'dish-register';
    stubKeyedTransactionGet({
      dishes: { [REGISTER_DISH_ID]: RECIPE_DISH },
      ingredients: {
        rice: { name: 'Rice', quantity: 500, isPresent: null },
        salt: { name: 'Salt', quantity: null, isPresent: true },
      },
    });

    const batchId = await registerBatch({
      dishId: REGISTER_DISH_ID,
      actualYield: 8,
      preparedAtMillis: 1_700_050_000_000,
      expiresAtMillis: 1_700_500_000_000,
      adminUid: ADMIN_UID,
    });

    // One ingredient update (rice) + one movement (rice) + one batch set + one counter set.
    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    expect(mockTransaction.set).toHaveBeenCalledTimes(3);

    const [ingredientRef, ingredientPatch] = mockTransaction.update.mock.calls[0] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(ingredientRef.__args).toContain('rice');
    expect(ingredientPatch).toMatchObject({ quantity: 200 });

    const [, movement] = mockTransaction.set.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(movement).toMatchObject({
      ingredientId: 'rice',
      type: 'cooking',
      deltaQuantity: -300,
      balanceAfter: 200,
      preparedBatchId: batchId,
      cookingRequestId: null, // Ad-hoc cooking: no request
    });

    const [, batch] = mockTransaction.set.mock.calls[1] as [unknown, Record<string, unknown>];
    expect(batch).toMatchObject({
      batchNumber: 1,
      producedQuantity: 8,
      availableQuantity: 8, // Full yield available for ad-hoc cooking
      reservedQuantity: 0,
      consumedQuantity: 0,
      discardedQuantity: 0,
      status: 'available',
      sourceCookingRequestId: null, // No source request
    });
    // Conservation: produced == available + reserved + consumed + discarded.
    expect(batch.availableQuantity).toBe(batch.producedQuantity);

    const [counterRef, counterPatch] = mockTransaction.set.mock.calls[2] as [
      { __args: unknown[] },
      Record<string, unknown>,
    ];
    expect(counterRef.__args).toContain('counters');
    expect(counterPatch).toMatchObject({ value: 1 });
  });

  it('allocates the next batch number as counter.value + 1 when the counter already has a value', async () => {
    const REGISTER_DISH_ID = 'dish-register-2';
    stubKeyedTransactionGet({
      dishes: { [REGISTER_DISH_ID]: RECIPE_DISH },
      ingredients: {
        rice: { name: 'Rice', quantity: 500, isPresent: null },
        salt: { name: 'Salt', quantity: null, isPresent: true },
      },
      counters: { preparedBatchNumber: { value: 41 } },
    });

    await registerBatch({
      dishId: REGISTER_DISH_ID,
      actualYield: 8,
      preparedAtMillis: 1_700_050_000_000,
      expiresAtMillis: 1_700_500_000_000,
      adminUid: ADMIN_UID,
    });

    const [, batch] = mockTransaction.set.mock.calls[1] as [unknown, Record<string, unknown>];
    expect(batch).toMatchObject({ batchNumber: 42 });

    const [, counterPatch] = mockTransaction.set.mock.calls[2] as [unknown, Record<string, unknown>];
    expect(counterPatch).toMatchObject({ value: 42 });
  });

  it('fails atomically with insufficient inventory', async () => {
    const REGISTER_DISH_ID = 'dish-insufficient';
    stubKeyedTransactionGet({
      dishes: { [REGISTER_DISH_ID]: RECIPE_DISH },
      ingredients: {
        rice: { name: 'Rice', quantity: 100, isPresent: null }, // Too little
        salt: { name: 'Salt', quantity: null, isPresent: true },
      },
    });

    await expect(
      registerBatch({
        dishId: REGISTER_DISH_ID,
        actualYield: 4,
        preparedAtMillis: 1_700_050_000_000,
        expiresAtMillis: 1_700_500_000_000,
        adminUid: ADMIN_UID,
      }),
    ).rejects.toBeInstanceOf(OrderTransactionError);

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).toHaveBeenCalledTimes(0);
  });

  it('fails atomically when the dish does not exist', async () => {
    stubKeyedTransactionGet({ dishes: {} });

    await expect(
      registerBatch({
        dishId: 'nonexistent-dish',
        actualYield: 4,
        preparedAtMillis: 1_700_050_000_000,
        expiresAtMillis: 1_700_500_000_000,
        adminUid: ADMIN_UID,
      }),
    ).rejects.toBeInstanceOf(OrderTransactionError);

    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('fails atomically when the dish has no recipe', async () => {
    const REGISTER_DISH_ID = 'dish-empty-recipe';
    stubKeyedTransactionGet({
      dishes: { [REGISTER_DISH_ID]: { name: 'Empty dish', recipeItems: [] } },
      ingredients: {},
    });

    await expect(
      registerBatch({
        dishId: REGISTER_DISH_ID,
        actualYield: 4,
        preparedAtMillis: 1_700_050_000_000,
        expiresAtMillis: 1_700_500_000_000,
        adminUid: ADMIN_UID,
      }),
    ).rejects.toBeInstanceOf(OrderTransactionError);

    expect(mockTransaction.set).not.toHaveBeenCalled();
  });
});
