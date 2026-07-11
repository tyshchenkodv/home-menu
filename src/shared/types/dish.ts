import type { Timestamp } from 'firebase/firestore';

import type { Dish } from '../../domain/dishes/types';

/**
 * Firestore-facing `dishes/{dishId}` document shape: the pure domain
 * `Dish<TTimestamp>` generic bound to the concrete Firebase `Timestamp` type.
 * This is the only place the domain shape and Firebase are wired together;
 * `src/domain/**` itself stays framework-free.
 */
export type DishDoc = Dish<Timestamp>;

/** A `DishDoc` paired with its Firestore document id. */
export type DishWithId = DishDoc & { id: string };
