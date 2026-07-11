import { cancelOrder } from '../../../infrastructure/firebase/services/orderTransactions';
import { useAuth } from '../../auth/useAuth';

export interface UseOrderCommandsResult {
  cancel: (orderId: string) => Promise<void>;
}

/** Binds the My Orders cancellation mutation to the signed-in user's identity. */
export const useOrderCommands = (): UseOrderCommandsResult => {
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  return {
    cancel: orderId => cancelOrder({ orderId, userId }),
  };
};
