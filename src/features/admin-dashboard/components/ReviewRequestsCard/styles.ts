import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Full-width filled quick-action row with a soft shadow (matching the tiles),
 * label on the left and count badge on the right.
 */
export const cardSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  padding: 2.5,
  borderRadius: '20px',
  color: 'text.primary',
  textDecoration: 'none',
  minHeight: 64,
  backgroundColor: 'background.paper',
  boxShadow: '0 6px 18px rgba(58, 46, 52, 0.08)',
  transition: 'box-shadow 120ms ease',
  '&:hover': { boxShadow: '0 8px 24px rgba(58, 46, 52, 0.14)' },
};
