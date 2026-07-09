import Chip from '@mui/material/Chip';

export interface StatusChipProps {
  label: string;
  color: 'success' | 'warning' | 'default';
}

/**
 * Small semantic-color pill used to surface an ingredient's stock status.
 * The color is always paired with a visible text label so the signal never
 * relies on color alone.
 */
export const StatusChip = ({ label, color }: StatusChipProps) => <Chip color={color} size="small" label={label} />;
