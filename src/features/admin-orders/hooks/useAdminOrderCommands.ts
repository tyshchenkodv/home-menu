import {
  approveRequest,
  completeCooking,
  consumeOrder,
  correctOrder,
  rejectRequest,
  startCooking,
  type CompleteCookingInput,
} from '../../../infrastructure/firebase/services/orderTransactions';
import { useAuth } from '../../auth/useAuth';

export interface UseAdminOrderCommandsResult {
  approve: (orderId: string) => Promise<void>;
  reject: (orderId: string, reason: string | null) => Promise<void>;
  startCooking: (orderId: string) => Promise<void>;
  completeCooking: (input: Omit<CompleteCookingInput, 'adminUid'>) => Promise<string>;
  correct: (orderId: string, reason: string) => Promise<void>;
  /** Admin "mark reserved consumed" (SPEC Goal 14, T5.8): `reserved`|`prepared` -> `consumed`, no time gate. */
  consume: (orderId: string) => Promise<void>;
  /**
   * Admin cancel of a `reserved` order (T5.8's row-5 "Cancel" button). Reuses
   * `correctOrder` — not `cancelOrder` — because `cancelOrder` enforces
   * *self*-cancellation (owner-uid match + `canUserCancelOrder`'s time gate),
   * neither of which applies to an admin acting on another user's order;
   * `correctOrder` is the existing admin-audited transaction that cancels
   * from any non-terminal status with no ownership or time restriction. The
   * design shows no dialog for this button, so the caller supplies a fixed,
   * localized reason rather than collecting free text.
   */
  cancel: (orderId: string, reason: string) => Promise<void>;
}

/** Binds every admin-orders mutation to the signed-in admin's identity. */
export const useAdminOrderCommands = (): UseAdminOrderCommandsResult => {
  const { user } = useAuth();
  const adminUid = user?.uid ?? '';

  return {
    approve: orderId => approveRequest(orderId, adminUid),
    reject: (orderId, reason) => rejectRequest({ orderId, adminUid, reason }),
    startCooking: orderId => startCooking(orderId, adminUid),
    completeCooking: input => completeCooking({ ...input, adminUid }),
    correct: (orderId, reason) => correctOrder({ orderId, adminUid, reason }),
    consume: orderId => consumeOrder({ orderId, adminUid }),
    cancel: (orderId, reason) => correctOrder({ orderId, adminUid, reason }),
  };
};
