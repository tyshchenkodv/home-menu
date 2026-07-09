import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Chip from '@mui/material/Chip';

import type { LowStockChipProps } from '../../../../../../types/lowStockChipProps';

/**
 * Low-stock indicator. The warning color is paired with an icon and a
 * visible text label so the signal never relies on color alone.
 */
export const LowStockChip = ({ label }: LowStockChipProps) => (
  <Chip color="warning" size="small" icon={<WarningAmberIcon fontSize="small" />} label={label} />
);
