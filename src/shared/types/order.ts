import type { Timestamp } from 'firebase/firestore';

import type { Order } from '../../domain/orders/types';

/**
 * Firestore-facing `orders/{orderId}` document shape: the pure domain
 * `Order<TTimestamp>` generic bound to the concrete Firebase `Timestamp`
 * type. This is the only place the domain shape and Firebase are wired
 * together; `src/domain/**` itself stays framework-free.
 */
export type OrderDoc = Order<Timestamp>;

/** An `OrderDoc` paired with its Firestore document id. */
export type OrderWithId = OrderDoc & { id: string };
