import { useAuth } from './useAuth';

/**
 * Centralizes role/activation route-access checks derived from `useAuth`.
 * `isAdmin` is `true` only for a fully authenticated (active, provisioned)
 * admin account.
 */
export const usePermissions = () => {
  const { status, role } = useAuth();

  return { status, role, isAdmin: status === 'authenticated' && role === 'admin' };
};
