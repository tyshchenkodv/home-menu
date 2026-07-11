import { useAuth } from '../../../features/auth/useAuth';
import { discardBatch, registerBatch } from '../../../infrastructure/firebase/services/orderTransactions';

interface RegisterBatchParams {
  dishId: string;
  actualYield: number;
  preparedAtMillis: number;
  expiresAtMillis: number | null;
}

/**
 * Provides admin batch commands: registerBatch (ad-hoc cooking without a request)
 * and discardBatch (discard available remainder).
 *
 * Both operations require admin authentication and throw domain/transaction
 * errors which presentation code maps to translated messages.
 */
export const useBatchCommands = () => {
  const auth = useAuth();

  const register = async (params: RegisterBatchParams): Promise<string> => {
    if (!auth.user?.uid) {
      throw new Error('Not authenticated');
    }

    return registerBatch({
      dishId: params.dishId,
      actualYield: params.actualYield,
      preparedAtMillis: params.preparedAtMillis,
      expiresAtMillis: params.expiresAtMillis,
      adminUid: auth.user.uid,
    });
  };

  const discard = async (batchId: string): Promise<void> => {
    if (!auth.user?.uid) {
      throw new Error('Not authenticated');
    }

    return discardBatch({
      batchId,
      adminUid: auth.user.uid,
    });
  };

  return { register, discard };
};
