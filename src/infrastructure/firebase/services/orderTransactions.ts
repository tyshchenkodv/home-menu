import {
  Timestamp,
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';

import { allocateReadyBatchesFifo } from '../../../domain/batches/allocateReadyBatchesFifo';
import { assertBatchConservation } from '../../../domain/batches/batchInvariants';
import type { AllocatableBatch } from '../../../domain/batches/types';
import type { AvailabilityIngredient } from '../../../domain/dishes/types';
import { evaluateDishAvailability } from '../../../domain/dishes/evaluateDishAvailability';
import { canUserCancelOrder } from '../../../domain/orders/cancellationRules';
import { canTransitionOrder } from '../../../domain/orders/canTransitionOrder';
import { OrderDomainError } from '../../../domain/orders/errors';
import { computeConsumedNormalization } from '../../../domain/orders/normalization';
import { isValidOrderQuantity } from '../../../domain/orders/scheduledFor';
import type { MealType, Order } from '../../../domain/orders/types';
import type { PreparedBatchDoc } from '../../../shared/types/preparedBatch';
import { dishConverter } from '../converters/dishConverter';
import { ingredientConverter } from '../converters/ingredientConverter';
import { inventoryMovementConverter } from '../converters/inventoryMovementConverter';
import { orderConverter } from '../converters/orderConverter';
import { preparedBatchConverter } from '../converters/preparedBatchConverter';
import { getFirebaseApp } from '../firebaseApp';

const DISHES_COLLECTION = 'dishes';
const BATCHES_COLLECTION = 'preparedBatches';
const ORDERS_COLLECTION = 'orders';
const INGREDIENTS_COLLECTION = 'ingredients';
const MOVEMENTS_COLLECTION = 'inventoryMovements';

const getDb = () => getFirestore(getFirebaseApp());

/**
 * Stable, locale-independent error codes for admin order-mutation
 * preconditions that have no existing domain error code and do not belong
 * in `src/domain/` (the PLAN keeps this task from modifying the domain
 * layer): an empty recipe (docs/04 "Reserving prepared food" step 1), a
 * missing dish/order, insufficient inventory to cover a recipe at
 * completion time, an actual yield that does not cover the requested
 * quantity (docs/04 "Completing cooking" step 4), or a malformed yield
 * input. Presentation code maps these the same way it maps
 * `OrderDomainError`/`BatchDomainError` codes — never rendering them
 * directly.
 */
export type OrderTransactionErrorCode =
  | 'order/dish-not-configured'
  | 'order/dish-not-found'
  | 'order/not-found'
  | 'order/not-owned'
  | 'order/invalid-yield'
  | 'order/insufficient-inventory'
  | 'order/yield-below-requested';

export class OrderTransactionError extends Error {
  readonly code: OrderTransactionErrorCode;

  constructor(code: OrderTransactionErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'OrderTransactionError';
    this.code = code;
  }
}

export interface ReserveReadyOrderInput {
  dishId: string;
  quantity: number;
  mealType: MealType;
  /** UTC epoch millis built by `domain/orders/scheduledFor.buildScheduledForMillis`. */
  scheduledForMillis: number;
  userId: string;
  userDisplayName: string;
}

/**
 * The Firestore Web SDK's `Transaction.get()` only accepts a
 * `DocumentReference` (unlike some server SDKs, it cannot run a `Query`
 * inside a transaction). So this discovers candidate batch ids with a
 * plain, non-transactional query *before* opening the transaction, then the
 * transaction re-reads each candidate by id — the authoritative,
 * conflict-detected read that decides the actual allocation. A batch that
 * changed between this lookup and the transaction (or a brand new batch
 * that did not exist yet) is exactly the "Concurrency" case docs/04
 * describes: Firestore retries the whole callback on a lost optimistic
 * write, and a losing client re-evaluates against fresher counters instead
 * of silently overselling.
 */
async function fetchCandidateAvailableBatchIds(dishId: string): Promise<string[]> {
  const availableBatchesQuery = query(
    collection(getDb(), BATCHES_COLLECTION),
    where('dishId', '==', dishId),
    where('status', '==', 'available'),
    orderBy('preparedAt', 'asc'),
  );
  const snapshot = await getDocs(availableBatchesQuery);

  return snapshot.docs.map(batchDoc => batchDoc.id);
}

/**
 * Implements `docs/04-business-logic.md` "Reserving prepared food" as a
 * single Firestore transaction — the pattern every later mutation task in
 * `docs/specifications/mvp-completion/PLAN.md` (Tasks 5–7) mirrors:
 *
 * 1. re-read the dish and require a non-empty recipe;
 * 2. re-read the oldest `available` batches for the dish (FIFO by
 *    `preparedAt`, candidates discovered by `fetchCandidateAvailableBatchIds`);
 * 3. verify total `availableQuantity` covers the requested quantity
 *    (`allocateReadyBatchesFifo` throws `batch/insufficient-available`
 *    otherwise);
 * 4. decrement `availableQuantity` and increment `reservedQuantity` on every
 *    allocated batch;
 * 5. create the order with `reserved` status and the resulting allocations.
 *
 * All reads happen before any write inside the transaction (a Firestore
 * requirement), so the whole operation fails atomically — no order and no
 * counter change persist — on insufficient stock or a concurrent conflict.
 *
 * Rules-layer note: Firestore Security Rules cannot conveniently aggregate
 * "sum of availableQuantity across N batches equals the allocated total"
 * for an arbitrary number of batches (`docs/06-auth-and-security.md`
 * "Client-only limitations"). The `firestore.rules` `preparedBatches` block
 * therefore denies every direct user write to the collection except the
 * narrow single-document counter move this transaction issues; this
 * transaction is the sole enforcer of the cross-document FIFO/atomicity
 * invariant, and admins may still write batches directly for corrections.
 */
export async function reserveReadyOrder(input: ReserveReadyOrderInput): Promise<string> {
  if (!isValidOrderQuantity(input.quantity)) {
    throw new OrderDomainError(
      'order/invalid-quantity',
      `quantity must be an integer in 1..99, got: ${String(input.quantity)}`,
    );
  }

  const db = getDb();
  const orderRef = doc(collection(db, ORDERS_COLLECTION)).withConverter(orderConverter);
  const candidateBatchIds = await fetchCandidateAvailableBatchIds(input.dishId);

  await runTransaction(db, async transaction => {
    const dishRef = doc(db, DISHES_COLLECTION, input.dishId).withConverter(dishConverter);
    const dishSnapshot = await transaction.get(dishRef);

    if (!dishSnapshot.exists()) {
      throw new OrderTransactionError('order/dish-not-found', `Dish ${input.dishId} does not exist`);
    }

    const dish = dishSnapshot.data();
    if (dish.recipeItems.length === 0) {
      throw new OrderTransactionError('order/dish-not-configured', `Dish ${input.dishId} has no recipe`);
    }

    const batchRefs = candidateBatchIds.map(batchId =>
      doc(db, BATCHES_COLLECTION, batchId).withConverter(preparedBatchConverter),
    );
    const batchSnapshots = await Promise.all(batchRefs.map(batchRef => transaction.get(batchRef)));

    const allocatableBatches: AllocatableBatch[] = [];
    const freshBatchDataById = new Map<string, ReturnType<(typeof batchSnapshots)[number]['data']>>();

    for (const snapshot of batchSnapshots) {
      if (!snapshot.exists()) {
        continue;
      }
      const data = snapshot.data();
      freshBatchDataById.set(snapshot.id, data);
      if (data.status === 'available') {
        allocatableBatches.push({
          batchId: snapshot.id,
          availableQuantity: data.availableQuantity,
          preparedAt: data.preparedAt,
        });
      }
    }

    // Throws `batch/insufficient-available` (a `BatchDomainError`) when the
    // total available stock cannot cover `input.quantity`; no write happens
    // in that case because every write below is queued after this call.
    const allocations = allocateReadyBatchesFifo(allocatableBatches, input.quantity);

    const now = Timestamp.now();

    for (const allocation of allocations) {
      const batchData = freshBatchDataById.get(allocation.batchId);
      /* istanbul ignore next -- defensive: allocation.batchId always comes from allocatableBatches, built from freshBatchDataById's own keys */
      if (!batchData) {
        continue;
      }

      const batchRef = doc(db, BATCHES_COLLECTION, allocation.batchId).withConverter(preparedBatchConverter);
      const nextAvailable = batchData.availableQuantity - allocation.quantity;
      const nextReserved = batchData.reservedQuantity + allocation.quantity;
      const nextStatus = nextAvailable === 0 ? 'depleted' : 'available';

      // Defensive: assert the patched batch satisfies the docs/03
      // conservation invariant before it is ever written.
      const patchedBatch: PreparedBatchDoc = {
        ...batchData,
        availableQuantity: nextAvailable,
        reservedQuantity: nextReserved,
        status: nextStatus,
      };
      assertBatchConservation(patchedBatch);

      transaction.update(batchRef, {
        availableQuantity: nextAvailable,
        reservedQuantity: nextReserved,
        status: nextStatus,
        updatedAt: now,
        updatedBy: input.userId,
      });
    }

    transaction.set(orderRef, {
      userId: input.userId,
      userDisplayName: input.userDisplayName,
      dishId: input.dishId,
      dishName: dish.name,
      kind: 'ready',
      status: 'reserved',
      quantity: input.quantity,
      mealType: input.mealType,
      scheduledFor: Timestamp.fromMillis(input.scheduledForMillis),
      allocations,
      rejectionReason: null,
      preparedBatchId: null,
      createdAt: now,
      createdBy: input.userId,
      updatedAt: now,
      updatedBy: input.userId,
    });
  });

  return orderRef.id;
}

export interface CancelOrderInput {
  orderId: string;
  userId: string;
}

/**
 * Implements `docs/04-business-logic.md` "Cancellation" as the exact inverse
 * of `reserveReadyOrder`, as a single Firestore transaction:
 *
 * - re-reads the order and requires `canUserCancelOrder` to allow it (a
 *   `ready` order only while still `reserved` and `now < scheduledFor`; a
 *   `cook` order only while `pending` or `approved`), and cross-checks the
 *   same call against `canTransitionOrder`'s `userCancel` matrix;
 * - for a `ready` order, re-reads every allocated batch and restores its
 *   counters (`reservedQuantity -= quantity`, `availableQuantity += quantity`),
 *   flipping a fully-restored batch back to `available`; a `cook` order has
 *   no allocations to restore;
 * - sets the order to `cancelled`.
 *
 * All reads happen before any write inside the transaction (a Firestore
 * requirement), so the whole operation fails atomically — no counter or
 * status change persists — when cancellation is not allowed.
 *
 * Rules-layer note: mirrors `reserveReadyOrder`'s note above — the
 * `firestore.rules` `preparedBatches` block's `isUserCancellationMove`
 * validates only this one document's inverse-shaped move; this transaction
 * is the sole enforcer of the conservation invariant across every allocated
 * batch.
 */
export async function cancelOrder(input: CancelOrderInput): Promise<void> {
  const db = getDb();

  await runTransaction(db, async transaction => {
    const orderRef = doc(db, ORDERS_COLLECTION, input.orderId).withConverter(orderConverter);
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new OrderTransactionError('order/not-found', `Order ${input.orderId} does not exist`);
    }

    const order = orderSnapshot.data();

    // Defense in depth: Firestore Security Rules already restrict this move
    // to the order's own owner, but this transaction is the sole enforcer of
    // the cross-document allocation-restore invariant, so it re-checks
    // ownership itself rather than relying solely on the rules layer.
    if (order.userId !== input.userId) {
      throw new OrderTransactionError('order/not-owned', `Order ${input.orderId} does not belong to ${input.userId}`);
    }

    const now = Timestamp.now();

    if (!canUserCancelOrder(order, now) || !canTransitionOrder(order.status, 'cancelled', 'userCancel')) {
      throw new OrderDomainError(
        'order/cancel-not-allowed',
        `Order ${input.orderId} (kind: ${order.kind}, status: ${order.status}) cannot be cancelled now`,
      );
    }

    // All reads (order + every allocated batch) happen before any write.
    const batchRefs = order.allocations.map(allocation =>
      doc(db, BATCHES_COLLECTION, allocation.batchId).withConverter(preparedBatchConverter),
    );
    const batchSnapshots = await Promise.all(batchRefs.map(batchRef => transaction.get(batchRef)));

    batchSnapshots.forEach((batchSnapshot, index) => {
      /* istanbul ignore next -- defensive: an allocated batch is created in the same transaction that wrote the order and is never physically deleted */
      if (!batchSnapshot.exists()) {
        return;
      }

      const batchData = batchSnapshot.data();
      const allocation = order.allocations[index];
      const nextAvailable = batchData.availableQuantity + allocation.quantity;
      const nextReserved = batchData.reservedQuantity - allocation.quantity;
      const nextStatus = nextAvailable === 0 ? 'depleted' : 'available';

      // Defensive: assert the patched batch satisfies the docs/03
      // conservation invariant before it is ever written.
      const patchedBatch: PreparedBatchDoc = {
        ...batchData,
        availableQuantity: nextAvailable,
        reservedQuantity: nextReserved,
        status: nextStatus,
      };
      assertBatchConservation(patchedBatch);

      transaction.update(batchRefs[index], {
        availableQuantity: nextAvailable,
        reservedQuantity: nextReserved,
        status: nextStatus,
        updatedAt: now,
        updatedBy: input.userId,
      });
    });

    transaction.update(orderRef, {
      status: 'cancelled',
      updatedAt: now,
      updatedBy: input.userId,
    });
  });
}

/**
 * Shared shape for `approveRequest` and `rejectRequest`: re-read the order,
 * require the exact `canTransitionOrder` move for `action`, then write
 * `toStatus` plus any extra fields in one transaction. Both of these admin
 * transitions have no inventory or batch side effect (docs/04 "Cooking
 * request lifecycle": "Approval does not reserve ingredients"). `startCooking`
 * has its own transaction below — it re-checks inventory without deducting
 * anything.
 */
async function runSimpleOrderTransition(
  orderId: string,
  action: 'approve' | 'reject',
  toStatus: Order['status'],
  adminUid: string,
  extraPatch: Record<string, unknown> = {},
): Promise<void> {
  const db = getDb();

  await runTransaction(db, async transaction => {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId).withConverter(orderConverter);
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new OrderTransactionError('order/not-found', `Order ${orderId} does not exist`);
    }

    const order = orderSnapshot.data();

    if (!canTransitionOrder(order.status, toStatus, action)) {
      throw new OrderDomainError(
        'order/invalid-transition',
        `Order ${orderId} (status: ${order.status}) cannot ${action}`,
      );
    }

    transaction.update(orderRef, {
      status: toStatus,
      updatedAt: Timestamp.now(),
      updatedBy: adminUid,
      ...extraPatch,
    });
  });
}

/** Approves a pending cooking request (docs/04 "Cooking request lifecycle"): `pending` → `approved`, no inventory effect. */
export const approveRequest = (orderId: string, adminUid: string): Promise<void> =>
  runSimpleOrderTransition(orderId, 'approve', 'approved', adminUid);

export interface RejectRequestInput {
  orderId: string;
  adminUid: string;
  reason?: string | null;
}

/** Rejects a pending cooking request with an optional reason, stored in `rejectionReason` (docs/design/screens/admin-orders.md dialog 3). */
export const rejectRequest = (input: RejectRequestInput): Promise<void> =>
  runSimpleOrderTransition(input.orderId, 'reject', 'rejected', input.adminUid, {
    rejectionReason: input.reason?.trim() ? input.reason.trim() : null,
  });

/**
 * Starts cooking an approved request: `approved` → `cooking`. Implements
 * docs/04-business-logic.md "Cooking request lifecycle": "Approval does not
 * reserve ingredients. Inventory is checked again before starting and
 * transactionally when completing cooking." A single transaction:
 *
 * 1. requires the request to be `approved` (via `canTransitionOrder`'s
 *    `startCooking` move);
 * 2. re-reads the dish and requires a non-empty recipe;
 * 3. re-reads every recipe ingredient and verifies sufficient inventory via
 *    `evaluateDishAvailability` (reused, not reimplemented) — fails
 *    atomically otherwise (`order/insufficient-inventory`);
 * 4. writes `status: 'cooking'` only — no ingredient is deducted here; the
 *    actual deduction happens in `completeCooking`, which performs the same
 *    check again transactionally at that later point.
 *
 * All reads happen before the write inside the transaction, so the whole
 * operation fails atomically — no status change persists — when inventory
 * is insufficient or a concurrent conflict occurs.
 */
export async function startCooking(orderId: string, adminUid: string): Promise<void> {
  const db = getDb();

  await runTransaction(db, async transaction => {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId).withConverter(orderConverter);
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new OrderTransactionError('order/not-found', `Order ${orderId} does not exist`);
    }

    const order = orderSnapshot.data();

    if (!canTransitionOrder(order.status, 'cooking', 'startCooking')) {
      throw new OrderDomainError(
        'order/invalid-transition',
        `Order ${orderId} (status: ${order.status}) cannot startCooking`,
      );
    }

    const dishRef = doc(db, DISHES_COLLECTION, order.dishId).withConverter(dishConverter);
    const dishSnapshot = await transaction.get(dishRef);

    if (!dishSnapshot.exists()) {
      throw new OrderTransactionError('order/dish-not-found', `Dish ${order.dishId} does not exist`);
    }

    const dish = dishSnapshot.data();

    if (dish.recipeItems.length === 0) {
      throw new OrderTransactionError('order/dish-not-configured', `Dish ${order.dishId} has no recipe`);
    }

    // All reads (order, dish, every recipe ingredient) happen before any write.
    const ingredientRefs = dish.recipeItems.map(item =>
      doc(db, INGREDIENTS_COLLECTION, item.ingredientId).withConverter(ingredientConverter),
    );
    const ingredientSnapshots = await Promise.all(ingredientRefs.map(ingredientRef => transaction.get(ingredientRef)));

    const availabilityIngredients: AvailabilityIngredient[] = [];

    dish.recipeItems.forEach((item, index) => {
      const snapshot = ingredientSnapshots[index];
      if (!snapshot.exists()) {
        availabilityIngredients.push({ ingredientId: item.ingredientId, quantity: null, isPresent: null });
        return;
      }

      const data = snapshot.data();
      availabilityIngredients.push({
        ingredientId: item.ingredientId,
        quantity: data.quantity,
        isPresent: data.isPresent,
      });
    });

    const availability = evaluateDishAvailability(dish, [], availabilityIngredients);
    if (!availability.canCook) {
      throw new OrderTransactionError(
        'order/insufficient-inventory',
        `Dish ${order.dishId} does not have enough inventory to start cooking`,
      );
    }

    transaction.update(orderRef, {
      status: 'cooking',
      updatedAt: Timestamp.now(),
      updatedBy: adminUid,
    });
  });
}

export interface CompleteCookingInput {
  orderId: string;
  actualYield: number;
  preparedAtMillis: number;
  expiresAtMillis: number | null;
  adminUid: string;
}

/**
 * Implements `docs/04-business-logic.md` "Completing cooking" as a single
 * Firestore transaction:
 *
 * 1. requires the request to be `cooking` (via `canTransitionOrder`'s
 *    `completeCooking` move) and of `kind: 'cook'`;
 * 2. verifies the admin-entered actual yield covers the requested quantity
 *    — fails atomically otherwise (`order/yield-below-requested`);
 * 3. re-reads the dish and every recipe ingredient;
 * 4. verifies sufficient inventory via `evaluateDishAvailability` (reused,
 *    not reimplemented) — fails atomically otherwise
 *    (`order/insufficient-inventory`);
 * 5. deducts every quantity-tracked recipe ingredient and appends its
 *    `cooking` movement (presence-tracked ingredients are checked but never
 *    quantitatively deducted);
 * 6. creates the prepared batch: `producedQuantity` = actual yield,
 *    `reservedQuantity` = the order's requested quantity, the remainder
 *    starts `availableQuantity` — asserted against
 *    `assertBatchConservation` before it is ever written;
 * 7. sets the order's `preparedBatchId`, a single allocation for the
 *    reserved quantity, and `status: 'prepared'`.
 *
 * All reads happen before any write inside the transaction, so the whole
 * operation fails atomically — no ingredient, movement, batch, or order
 * change persists — on any of the above failures or a concurrent conflict.
 */
export async function completeCooking(input: CompleteCookingInput): Promise<string> {
  if (!isValidOrderQuantity(input.actualYield)) {
    throw new OrderTransactionError(
      'order/invalid-yield',
      `actualYield must be an integer in 1..99, got: ${String(input.actualYield)}`,
    );
  }

  const db = getDb();
  const batchRef = doc(collection(db, BATCHES_COLLECTION)).withConverter(preparedBatchConverter);

  await runTransaction(db, async transaction => {
    const orderRef = doc(db, ORDERS_COLLECTION, input.orderId).withConverter(orderConverter);
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new OrderTransactionError('order/not-found', `Order ${input.orderId} does not exist`);
    }

    const order = orderSnapshot.data();

    if (order.kind !== 'cook' || !canTransitionOrder(order.status, 'prepared', 'completeCooking')) {
      throw new OrderDomainError(
        'order/invalid-transition',
        `Order ${input.orderId} (kind: ${order.kind}, status: ${order.status}) cannot complete cooking`,
      );
    }

    if (input.actualYield < order.quantity) {
      throw new OrderTransactionError(
        'order/yield-below-requested',
        `Actual yield ${String(input.actualYield)} is below the requested quantity ${String(order.quantity)}`,
      );
    }

    const dishRef = doc(db, DISHES_COLLECTION, order.dishId).withConverter(dishConverter);
    const dishSnapshot = await transaction.get(dishRef);

    if (!dishSnapshot.exists()) {
      throw new OrderTransactionError('order/dish-not-found', `Dish ${order.dishId} does not exist`);
    }

    const dish = dishSnapshot.data();

    if (dish.recipeItems.length === 0) {
      throw new OrderTransactionError('order/dish-not-configured', `Dish ${order.dishId} has no recipe`);
    }

    // All reads (order, dish, every recipe ingredient) happen before any write.
    const ingredientRefs = dish.recipeItems.map(item =>
      doc(db, INGREDIENTS_COLLECTION, item.ingredientId).withConverter(ingredientConverter),
    );
    const ingredientSnapshots = await Promise.all(ingredientRefs.map(ingredientRef => transaction.get(ingredientRef)));

    const ingredientDataById = new Map<string, ReturnType<(typeof ingredientSnapshots)[number]['data']>>();
    const availabilityIngredients: AvailabilityIngredient[] = [];

    dish.recipeItems.forEach((item, index) => {
      const snapshot = ingredientSnapshots[index];
      if (!snapshot.exists()) {
        availabilityIngredients.push({ ingredientId: item.ingredientId, quantity: null, isPresent: null });
        return;
      }

      const data = snapshot.data();
      ingredientDataById.set(item.ingredientId, data);
      availabilityIngredients.push({
        ingredientId: item.ingredientId,
        quantity: data.quantity,
        isPresent: data.isPresent,
      });
    });

    const availability = evaluateDishAvailability(dish, [], availabilityIngredients);
    if (!availability.canCook) {
      throw new OrderTransactionError(
        'order/insufficient-inventory',
        `Dish ${order.dishId} does not have enough inventory to complete cooking`,
      );
    }

    const now = Timestamp.now();

    dish.recipeItems.forEach(item => {
      if (item.requiresPresence === true || item.requiredQuantity === null) {
        // Presence-tracked ingredients are checked above but never
        // quantitatively deducted or given a movement.
        return;
      }

      const ingredientData = ingredientDataById.get(item.ingredientId);
      /* istanbul ignore next -- defensive: every recipe ingredient's ref was read above, and evaluateDishAvailability already rejected a missing, non-quantity, or short one */
      if (ingredientData?.quantity == null) {
        return;
      }

      const ingredientRef = doc(db, INGREDIENTS_COLLECTION, item.ingredientId).withConverter(ingredientConverter);
      const balanceAfter = ingredientData.quantity - item.requiredQuantity;

      transaction.update(ingredientRef, {
        quantity: balanceAfter,
        updatedAt: now,
        updatedBy: input.adminUid,
      });

      const movementRef = doc(collection(db, MOVEMENTS_COLLECTION)).withConverter(inventoryMovementConverter);
      transaction.set(movementRef, {
        ingredientId: item.ingredientId,
        ingredientName: ingredientData.name,
        type: 'cooking',
        deltaQuantity: -item.requiredQuantity,
        presenceBefore: null,
        presenceAfter: null,
        balanceAfter,
        cookingRequestId: input.orderId,
        preparedBatchId: batchRef.id,
        note: null,
        createdAt: now,
        createdBy: input.adminUid,
      });
    });

    const availableQuantity = input.actualYield - order.quantity;

    const batch: PreparedBatchDoc = {
      dishId: order.dishId,
      dishName: dish.name,
      producedQuantity: input.actualYield,
      availableQuantity,
      reservedQuantity: order.quantity,
      consumedQuantity: 0,
      discardedQuantity: 0,
      preparedAt: Timestamp.fromMillis(input.preparedAtMillis),
      expiresAt: input.expiresAtMillis !== null ? Timestamp.fromMillis(input.expiresAtMillis) : null,
      status: availableQuantity === 0 ? 'depleted' : 'available',
      sourceCookingRequestId: input.orderId,
      createdAt: now,
      createdBy: input.adminUid,
      updatedAt: now,
      updatedBy: input.adminUid,
    };

    // Defensive: assert the constructed batch satisfies the docs/03
    // conservation invariant before it is ever written.
    assertBatchConservation(batch);

    transaction.set(batchRef, batch);

    transaction.update(orderRef, {
      status: 'prepared',
      preparedBatchId: batchRef.id,
      allocations: [{ batchId: batchRef.id, quantity: order.quantity }],
      updatedAt: now,
      updatedBy: input.adminUid,
    });
  });

  return batchRef.id;
}

export interface CorrectOrderInput {
  orderId: string;
  reason: string;
  adminUid: string;
}

/**
 * Implements SPEC "Domain and data model" rule 4 / `docs/04-business-logic.md`
 * "Cancellation" admin-audited correction: cancels an order/request from any
 * non-terminal status (`canTransitionOrder`'s `adminCorrection` move),
 * requiring a non-empty reason (stored in `rejectionReason`, reusing the
 * same field `rejectRequest` writes). Restores any reserved allocation
 * exactly like `cancelOrder`'s inverse-of-reservation math — this is the
 * only path that can retire a `prepared` cook order outside of
 * `normalizeConsumedOrders`, since a `prepared` order already has its
 * quantity reserved on the linked batch.
 */
export async function correctOrder(input: CorrectOrderInput): Promise<void> {
  const reason = input.reason.trim();
  if (reason.length === 0) {
    throw new OrderDomainError('order/correction-reason-required', 'correctOrder requires a non-empty reason');
  }

  const db = getDb();

  await runTransaction(db, async transaction => {
    const orderRef = doc(db, ORDERS_COLLECTION, input.orderId).withConverter(orderConverter);
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new OrderTransactionError('order/not-found', `Order ${input.orderId} does not exist`);
    }

    const order = orderSnapshot.data();

    if (!canTransitionOrder(order.status, 'cancelled', 'adminCorrection')) {
      throw new OrderDomainError(
        'order/invalid-transition',
        `Order ${input.orderId} (status: ${order.status}) cannot be corrected`,
      );
    }

    // All reads (order + every allocated batch) happen before any write.
    const batchRefs = order.allocations.map(allocation =>
      doc(db, BATCHES_COLLECTION, allocation.batchId).withConverter(preparedBatchConverter),
    );
    const batchSnapshots = await Promise.all(batchRefs.map(batchRef => transaction.get(batchRef)));

    const now = Timestamp.now();

    batchSnapshots.forEach((batchSnapshot, index) => {
      /* istanbul ignore next -- defensive: an allocated batch is created in the same transaction that wrote the order and is never physically deleted */
      if (!batchSnapshot.exists()) {
        return;
      }

      const batchData = batchSnapshot.data();
      const allocation = order.allocations[index];
      const nextAvailable = batchData.availableQuantity + allocation.quantity;
      const nextReserved = batchData.reservedQuantity - allocation.quantity;
      const nextStatus = nextAvailable === 0 ? 'depleted' : 'available';

      // Defensive: assert the patched batch satisfies the docs/03
      // conservation invariant before it is ever written.
      const patchedBatch: PreparedBatchDoc = {
        ...batchData,
        availableQuantity: nextAvailable,
        reservedQuantity: nextReserved,
        status: nextStatus,
      };
      assertBatchConservation(patchedBatch);

      transaction.update(batchRefs[index], {
        availableQuantity: nextAvailable,
        reservedQuantity: nextReserved,
        status: nextStatus,
        updatedAt: now,
        updatedBy: input.adminUid,
      });
    });

    transaction.update(orderRef, {
      status: 'cancelled',
      rejectionReason: reason,
      updatedAt: now,
      updatedBy: input.adminUid,
    });
  });
}

/**
 * Re-reads and normalizes a single order in its own transaction: applies
 * `computeConsumedNormalization` and, only when it reports
 * `shouldNormalize`, moves each allocation's quantity from `reservedQuantity`
 * to `consumedQuantity` on its batch and sets the order to `consumed`. A
 * `false` report (already `consumed`, still before `scheduledFor`, or the
 * order vanished) is a silent no-op, which is what makes the batch below
 * idempotent and safe against a stale candidate list.
 */
async function normalizeOneOrder(orderId: string, nowMillis: number, adminUid: string): Promise<void> {
  const db = getDb();

  await runTransaction(db, async transaction => {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId).withConverter(orderConverter);
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      return;
    }

    const order = orderSnapshot.data();
    const result = computeConsumedNormalization(order, { toMillis: () => nowMillis });

    if (!result.shouldNormalize || !result.orderPatch) {
      return;
    }

    // All reads (order + every allocated batch) happen before any write.
    const batchRefs = result.batchPatches.map(patch =>
      doc(db, BATCHES_COLLECTION, patch.batchId).withConverter(preparedBatchConverter),
    );
    const batchSnapshots = await Promise.all(batchRefs.map(batchRef => transaction.get(batchRef)));

    const now = Timestamp.now();

    batchSnapshots.forEach((batchSnapshot, index) => {
      /* istanbul ignore next -- defensive: an allocated batch is created in the same transaction that wrote the order and is never physically deleted */
      if (!batchSnapshot.exists()) {
        return;
      }

      const batchData = batchSnapshot.data();
      const patch = result.batchPatches[index];
      const nextReserved = batchData.reservedQuantity + patch.reservedDelta;
      const nextConsumed = batchData.consumedQuantity + patch.consumedDelta;

      // Defensive: assert the patched batch satisfies the docs/03
      // conservation invariant before it is ever written.
      const patchedBatch: PreparedBatchDoc = {
        ...batchData,
        reservedQuantity: nextReserved,
        consumedQuantity: nextConsumed,
      };
      assertBatchConservation(patchedBatch);

      transaction.update(batchRefs[index], {
        reservedQuantity: nextReserved,
        consumedQuantity: nextConsumed,
        updatedAt: now,
        updatedBy: adminUid,
      });
    });

    transaction.update(orderRef, {
      status: result.orderPatch.status,
      updatedAt: now,
      updatedBy: adminUid,
    });
  });
}

/**
 * Implements `docs/04-business-logic.md` "Automatic consumption": finds
 * every persisted `reserved`/`prepared` order whose `scheduledFor` has
 * passed `nowMillis` and normalizes each one in its own transaction. Mirrors
 * `reserveReadyOrder`'s candidate-then-re-read shape — a plain
 * (non-transactional) query discovers candidate order ids first (Firestore
 * transactions cannot run a `Query`), then `normalizeOneOrder` re-reads and
 * re-evaluates each one inside its own transaction, so a stale candidate
 * (already normalized by a previous or concurrent call) is simply skipped.
 * The whole batch is therefore safe to call repeatedly, e.g. every time an
 * admin opens the History tab.
 *
 * Uses `Promise.allSettled` rather than `Promise.all`: this runs from the
 * admin History tab and must stay resilient to one corrupted or conflicting
 * order (e.g. a stale conservation invariant, or a lost transaction retry) —
 * a single rejected settlement must not abort normalization of every other
 * eligible order in the batch. Idempotency is unaffected, since each
 * order's own transaction is still independently safe to retry later.
 */
export async function normalizeConsumedOrders(nowMillis: number, adminUid: string): Promise<void> {
  const db = getDb();
  const candidatesQuery = query(
    collection(db, ORDERS_COLLECTION),
    where('status', 'in', ['reserved', 'prepared']),
    where('scheduledFor', '<', Timestamp.fromMillis(nowMillis)),
  );
  const snapshot = await getDocs(candidatesQuery);

  await Promise.allSettled(snapshot.docs.map(orderDoc => normalizeOneOrder(orderDoc.id, nowMillis, adminUid)));
}

export interface DiscardBatchInput {
  batchId: string;
  adminUid: string;
}

/**
 * Implements `docs/04-business-logic.md` "Expiration" discard flow: admin
 * discards the available remainder of a batch. A single transaction:
 *
 * 1. re-reads the batch;
 * 2. moves availableQuantity → discardedQuantity, sets availableQuantity = 0;
 * 3. sets `status: 'discarded'` (`docs/03-data-model.md`'s `BatchStatus`
 *    includes `'discarded'` precisely for this admin action, distinct from
 *    `'depleted'`, which is reserved for a batch whose stock ran out through
 *    ordinary reservation/consumption; `BatchCard` and `OrderCard` both read
 *    `status === 'discarded'` directly);
 * 4. asserts the conservation invariant before writing.
 *
 * Reserved portions are never touched per SPEC rule 5 (docs/04 "Reserved
 * portions are not automatically discarded"): they remain tracked on the
 * batch under `reservedQuantity` and are not folded into `discardedQuantity`
 * by this call. The batch remains orderable by reserved orders per the spec
 * decision.
 */
export async function discardBatch(input: DiscardBatchInput): Promise<void> {
  const db = getDb();

  await runTransaction(db, async transaction => {
    const batchRef = doc(db, BATCHES_COLLECTION, input.batchId).withConverter(preparedBatchConverter);
    const batchSnapshot = await transaction.get(batchRef);

    if (!batchSnapshot.exists()) {
      throw new OrderTransactionError('order/not-found', `Batch ${input.batchId} does not exist`);
    }

    const batchData = batchSnapshot.data();
    const now = Timestamp.now();
    const nextDiscarded = batchData.discardedQuantity + batchData.availableQuantity;

    // Defensive: assert the patched batch satisfies the docs/03 conservation
    // invariant before it is ever written.
    const patchedBatch: PreparedBatchDoc = {
      ...batchData,
      discardedQuantity: nextDiscarded,
      availableQuantity: 0,
      status: 'discarded',
    };
    assertBatchConservation(patchedBatch);

    transaction.update(batchRef, {
      discardedQuantity: nextDiscarded,
      availableQuantity: 0,
      status: 'discarded',
      updatedAt: now,
      updatedBy: input.adminUid,
    });
  });
}

export interface RegisterBatchInput {
  dishId: string;
  actualYield: number;
  preparedAtMillis: number;
  expiresAtMillis: number | null;
  adminUid: string;
}

/**
 * Implements `docs/04-business-logic.md` "Completing cooking" ad-hoc admin
 * cooking without a user request. Similar to `completeCooking`, but:
 *
 * 1. there is no order/request to read (no sourceCookingRequestId);
 * 2. the full yield starts as `availableQuantity` (no reserved quantity);
 * 3. all other steps mirror `completeCooking`: verify dish + recipe, check
 *    inventory, deduct ingredients, append `cooking` movements, create batch,
 *    assert conservation.
 *
 * All reads happen before any write inside the transaction, so the whole
 * operation fails atomically — no ingredient, movement, or batch change
 * persists — on any failure or a concurrent conflict.
 */
export async function registerBatch(input: RegisterBatchInput): Promise<string> {
  if (!isValidOrderQuantity(input.actualYield)) {
    throw new OrderTransactionError(
      'order/invalid-yield',
      `actualYield must be an integer in 1..99, got: ${String(input.actualYield)}`,
    );
  }

  const db = getDb();
  const batchRef = doc(collection(db, BATCHES_COLLECTION)).withConverter(preparedBatchConverter);

  await runTransaction(db, async transaction => {
    const dishRef = doc(db, DISHES_COLLECTION, input.dishId).withConverter(dishConverter);
    const dishSnapshot = await transaction.get(dishRef);

    if (!dishSnapshot.exists()) {
      throw new OrderTransactionError('order/dish-not-found', `Dish ${input.dishId} does not exist`);
    }

    const dish = dishSnapshot.data();

    if (dish.recipeItems.length === 0) {
      throw new OrderTransactionError('order/dish-not-configured', `Dish ${input.dishId} has no recipe`);
    }

    // All reads (dish, every recipe ingredient) happen before any write.
    const ingredientRefs = dish.recipeItems.map(item =>
      doc(db, INGREDIENTS_COLLECTION, item.ingredientId).withConverter(ingredientConverter),
    );
    const ingredientSnapshots = await Promise.all(ingredientRefs.map(ingredientRef => transaction.get(ingredientRef)));

    const ingredientDataById = new Map<string, ReturnType<(typeof ingredientSnapshots)[number]['data']>>();
    const availabilityIngredients: AvailabilityIngredient[] = [];

    dish.recipeItems.forEach((item, index) => {
      const snapshot = ingredientSnapshots[index];
      if (!snapshot.exists()) {
        availabilityIngredients.push({ ingredientId: item.ingredientId, quantity: null, isPresent: null });
        return;
      }

      const data = snapshot.data();
      ingredientDataById.set(item.ingredientId, data);
      availabilityIngredients.push({
        ingredientId: item.ingredientId,
        quantity: data.quantity,
        isPresent: data.isPresent,
      });
    });

    const availability = evaluateDishAvailability(dish, [], availabilityIngredients);
    if (!availability.canCook) {
      throw new OrderTransactionError(
        'order/insufficient-inventory',
        `Dish ${input.dishId} does not have enough inventory to complete cooking`,
      );
    }

    const now = Timestamp.now();

    // Deduct ingredients and create movements
    dish.recipeItems.forEach(item => {
      if (item.requiresPresence === true || item.requiredQuantity === null) {
        // Presence-tracked ingredients are checked above but never
        // quantitatively deducted or given a movement.
        return;
      }

      const ingredientData = ingredientDataById.get(item.ingredientId);
      /* istanbul ignore next -- defensive: every recipe ingredient's ref was read above, and evaluateDishAvailability already rejected a missing, non-quantity, or short one */
      if (ingredientData?.quantity == null) {
        return;
      }

      const ingredientRef = doc(db, INGREDIENTS_COLLECTION, item.ingredientId).withConverter(ingredientConverter);
      const balanceAfter = ingredientData.quantity - item.requiredQuantity;

      transaction.update(ingredientRef, {
        quantity: balanceAfter,
        updatedAt: now,
        updatedBy: input.adminUid,
      });

      const movementRef = doc(collection(db, MOVEMENTS_COLLECTION)).withConverter(inventoryMovementConverter);
      transaction.set(movementRef, {
        ingredientId: item.ingredientId,
        ingredientName: ingredientData.name,
        type: 'cooking',
        deltaQuantity: -item.requiredQuantity,
        presenceBefore: null,
        presenceAfter: null,
        balanceAfter,
        cookingRequestId: null, // No request for ad-hoc cooking
        preparedBatchId: batchRef.id,
        note: null,
        createdAt: now,
        createdBy: input.adminUid,
      });
    });

    const batch: PreparedBatchDoc = {
      dishId: input.dishId,
      dishName: dish.name,
      producedQuantity: input.actualYield,
      availableQuantity: input.actualYield, // Full yield available (no reserved quantity)
      reservedQuantity: 0,
      consumedQuantity: 0,
      discardedQuantity: 0,
      preparedAt: Timestamp.fromMillis(input.preparedAtMillis),
      expiresAt: input.expiresAtMillis !== null ? Timestamp.fromMillis(input.expiresAtMillis) : null,
      status: 'available',
      sourceCookingRequestId: null, // Ad-hoc cooking has no request
      createdAt: now,
      createdBy: input.adminUid,
      updatedAt: now,
      updatedBy: input.adminUid,
    };

    // Defensive: assert the constructed batch satisfies the docs/03
    // conservation invariant before it is ever written.
    assertBatchConservation(batch);

    transaction.set(batchRef, batch);
  });

  return batchRef.id;
}
