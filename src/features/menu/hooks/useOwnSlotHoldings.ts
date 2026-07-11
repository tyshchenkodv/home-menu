import { useEffect, useState } from 'react';

import type { OwnHoldingOrder } from '../../../domain/orders/summarizeOwnSlotHoldings';
import { subscribeOwnOrders } from '../../../infrastructure/firebase/services/orderService';
import { toCalendarDate } from '../utils/buildDateOptions';
import { buildSlotKey, KYIV_TIME_ZONE } from '../utils/slotKey';

/**
 * Subscribes to the signed-in user's own orders and reduces each to the
 * shape `summarizeOwnSlotHoldings` needs, day-level slot matching them via
 * `buildSlotKey`. Best-effort for the menu's own-holdings hint (SPEC "Data
 * source"): returns `[]` while loading or on subscription error so the
 * menu's own status is never affected.
 */
export const useOwnSlotHoldings = (userId: string): OwnHoldingOrder[] => {
  const [holdings, setHoldings] = useState<OwnHoldingOrder[]>([]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeOwnOrders(
      userId,
      orders => {
        setHoldings(
          orders.map(order => ({
            dishId: order.dishId,
            slotKey: buildSlotKey(toCalendarDate(order.scheduledFor.toMillis(), KYIV_TIME_ZONE), order.mealType),
            kind: order.kind,
            status: order.status,
            quantity: order.quantity,
          })),
        );
      },
      () => {
        setHoldings([]);
      },
    );
  }, [userId]);

  if (!userId) {
    return [];
  }

  return holdings;
};
