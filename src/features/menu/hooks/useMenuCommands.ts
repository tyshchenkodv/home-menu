import type { MealType } from '../../../domain/orders/types';
import { createCookingRequest } from '../../../infrastructure/firebase/services/orderService';
import { reserveReadyOrder } from '../../../infrastructure/firebase/services/orderTransactions';
import { useAuth } from '../../auth/useAuth';

export interface ReserveCommandInput {
  dishId: string;
  quantity: number;
  mealType: MealType;
  scheduledForMillis: number;
}

export interface CookingRequestCommandInput {
  dishId: string;
  dishName: string;
  quantity: number;
  mealType: MealType;
  scheduledForMillis: number;
}

export interface UseMenuCommandsResult {
  reserve: (input: ReserveCommandInput) => Promise<string>;
  requestCooking: (input: CookingRequestCommandInput) => Promise<string>;
}

/**
 * Binds the menu's two mutations to the signed-in user identity, so screen
 * components never read `useAuth` themselves just to pass `userId`/
 * `userDisplayName` through.
 */
export const useMenuCommands = (): UseMenuCommandsResult => {
  const { user, profile } = useAuth();
  const userId = user?.uid ?? '';
  const userDisplayName = profile?.displayName ?? '';

  return {
    reserve: input =>
      reserveReadyOrder({
        dishId: input.dishId,
        quantity: input.quantity,
        mealType: input.mealType,
        scheduledForMillis: input.scheduledForMillis,
        userId,
        userDisplayName,
      }),
    requestCooking: input =>
      createCookingRequest(
        {
          dishId: input.dishId,
          dishName: input.dishName,
          quantity: input.quantity,
          mealType: input.mealType,
          scheduledForMillis: input.scheduledForMillis,
        },
        userId,
        userDisplayName,
      ),
  };
};
