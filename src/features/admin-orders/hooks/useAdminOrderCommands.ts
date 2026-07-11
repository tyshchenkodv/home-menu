import {
  approveRequest,
  completeCooking,
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
  };
};
