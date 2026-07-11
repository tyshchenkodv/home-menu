import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';
import { preparedBatchConverter } from '../converters/preparedBatchConverter';
import { getFirebaseApp } from '../firebaseApp';

const COLLECTION = 'preparedBatches';

const getBatchesCollection = () => collection(getFirestore(getFirebaseApp()), COLLECTION);

/**
 * Subscribes to a dish's `available` prepared batches, oldest first — the
 * same ordering `orderTransactions.reserveReadyOrder` reads inside its
 * transaction (docs/04 "Reserving prepared food", FIFO by `preparedAt`).
 * Feeds both the menu's ready-portion count and the reservation dialog's
 * per-batch stepper maximum.
 */
export const subscribeAvailableBatchesForDish = (
  dishId: string,
  onNext: (batches: PreparedBatchWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const availableQuery = query(
    getBatchesCollection().withConverter(preparedBatchConverter),
    where('dishId', '==', dishId),
    where('status', '==', 'available'),
    orderBy('preparedAt', 'asc'),
  );

  return onSnapshot(
    availableQuery,
    snapshot => {
      onNext(snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    onError,
  );
};

/**
 * One-time fetch of specific batches by id, used by My Orders to show a
 * warning when a reserved order's underlying batch has expired or was
 * discarded (SPEC "Domain and data model" rule 5). A batch that no longer
 * exists (never happens — batches are never physically deleted, see
 * `firestore.rules`) is silently omitted rather than failing the whole
 * lookup.
 */
export const getBatchesByIds = async (batchIds: string[]): Promise<PreparedBatchWithId[]> => {
  const db = getFirestore(getFirebaseApp());
  const snapshots = await Promise.all(
    batchIds.map(batchId => getDoc(doc(db, COLLECTION, batchId).withConverter(preparedBatchConverter))),
  );

  return snapshots.filter(snapshot => snapshot.exists()).map(snapshot => ({ id: snapshot.id, ...snapshot.data() }));
};

/**
 * Subscribes to all prepared batches ordered by preparedAt descending
 * (newest first). Used by the admin batches view.
 */
export const subscribeAllBatches = (
  onNext: (batches: PreparedBatchWithId[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const allBatchesQuery = query(
    getBatchesCollection().withConverter(preparedBatchConverter),
    orderBy('preparedAt', 'desc'),
  );

  return onSnapshot(
    allBatchesQuery,
    snapshot => {
      onNext(snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() })));
    },
    onError,
  );
};
