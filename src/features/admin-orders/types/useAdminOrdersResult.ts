import type { OrderWithId } from '../../../shared/types/order';

export type UseAdminOrdersStatus = 'loading' | 'ready' | 'error';

export interface UseAdminOrdersResult {
  status: UseAdminOrdersStatus;
  orders: OrderWithId[];
  error: Error | null;
}
