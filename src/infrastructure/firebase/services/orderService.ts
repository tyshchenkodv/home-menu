import {
  Timestamp,
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
  type WithFieldValue,
} from 'firebase/firestore';

import { OrderDomainError } from '../../../domain/orders/errors';
import { isValidOrderQuantity } from '../../../domain/orders/scheduledFor';
import type { MealType, OrderStatus } from '../../../domain/orders/types';
import type { OrderDoc, OrderWithId } from '../../../shared/types/order';
import { orderConverter } from '../converters/orderConverter';
import { getFirebaseApp } from '../firebaseApp';

const COLLECTION = 'orders';

const getOrdersCollection = () => collection(getFirestore(getFirebaseApp()), COLLECTION);

/** Fields a user supplies when asking the household to cook a dish. */
export interface CreateCookingRequestInput {
  dishId: string;
  dishName: string;
  quantity: number;
  mealType: MealType;
  scheduledForMillis: number;
}

/**
 * Creates a cooking request order: `kind: 'cook'`, `status: 'pending'`, no
 * allocations yet (docs/04 "Cooking request lifecycle" — allocations remain
 * empty until cooking completes, which is a later task). Re-validates the
 * portion bounds domain rule before writing, mirroring `dishService`'s
 * defense-in-depth pattern.
 */
export const createCookingRequest = async (
  input: CreateCookingRequestInput,
  userId: string,
  userDisplayName: string,
): Promise<string> => {
  if (!isValidOrderQuantity(input.quantity)) {
    throw new OrderDomainError(
      'order/invalid-quantity',
      `quantity must be an integer in 1..99, got: ${String(input.quantity)}`,
    );
  }

  const docRef = await addDoc(getOrdersCollection(), {
    userId,
    userDisplayName,
    dishId: input.dishId,
    dishName: input.dishName,
    kind: 'cook',
    status: 'pending',
    quantity: input.quantity,
    mealType: input.mealType,
    scheduledFor: Timestamp.fromMillis(input.scheduledForMillis),
    allocations: [],
    rejectionReason: null,
    preparedBatchId: null,
    preparedBatchNumber: null,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  } satisfies WithFieldValue<OrderDoc>);

  return docRef.id;
};

/** Subscribes to the signed-in user's own orders, most recently scheduled first. */
export const subscribeOwnOrders = (
  userId: string,
  onNext: (orders: OrderWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const ownOrdersQuery = query(
    getOrdersCollection().withConverter(orderConverter),
    where('userId', '==', userId),
    orderBy('scheduledFor', 'desc'),
  );

  return onSnapshot(
    ownOrdersQuery,
    snapshot => {
      onNext(snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    onError,
  );
};

/**
 * Subscribes to every `kind: 'cook'` order in one of the 4 active Kanban
 * statuses (docs/design/screens/admin-orders.md), oldest-scheduled first —
 * uses the `kind + status + scheduledFor` composite index.
 */
export const subscribeAdminBoardOrders = (
  onNext: (orders: OrderWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const boardQuery = query(
    getOrdersCollection().withConverter(orderConverter),
    where('kind', '==', 'cook'),
    where('status', 'in', ['pending', 'approved', 'cooking', 'prepared'] satisfies OrderStatus[]),
    orderBy('scheduledFor', 'asc'),
  );

  return onSnapshot(
    boardQuery,
    snapshot => {
      onNext(snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    onError,
  );
};

/**
 * Subscribes to every order (either kind) in one of the terminal History
 * statuses (`reserved`, `consumed`, `rejected`, `cancelled`), most recently
 * scheduled first — uses the `status + scheduledFor` composite index.
 */
export const subscribeAdminHistoryOrders = (
  statuses: OrderStatus[],
  onNext: (orders: OrderWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const historyQuery = query(
    getOrdersCollection().withConverter(orderConverter),
    where('status', 'in', statuses),
    orderBy('scheduledFor', 'desc'),
  );

  return onSnapshot(
    historyQuery,
    snapshot => {
      onNext(snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    onError,
  );
};
