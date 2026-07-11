import Chip from '@mui/material/Chip';

export interface StatusChipProps {
  label: string;
  color: 'success' | 'warning' | 'default' | 'secondary' | 'primary' | 'info' | 'error';
  variant?: 'filled' | 'outlined';
}

/**
 * Small semantic-color pill used to surface an ingredient's stock status, a
 * dish's derived availability (the 4-state matrix in
 * `docs/design/screens/shared-patterns.md`: ready now/success, can-be-cooked/
 * warning, unavailable/default, not-configured/secondary), or an order's
 * 8-status matrix (`docs/design/screens/my-orders.md` "05d"): pending/
 * primary, approved/info, cooking/warning, prepared/success, reserved/
 * secondary, consumed/default, rejected/error, cancelled/default outlined.
 * The color is always paired with a visible text label so the signal never
 * relies on color alone.
 */
export const StatusChip = ({ label, color, variant = 'filled' }: StatusChipProps) => (
  <Chip color={color} variant={variant} size="small" label={label} />
);
