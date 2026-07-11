import type { SxProps, Theme } from '@mui/material/styles';

export const styles = {
  container: {
    display: 'flex',
    width: '100%',
  },
  row: {
    flex: 1,
  },
  number: {
    fontWeight: 600,
  },
  label: {
    marginTop: 0.5,
    color: 'text.secondary',
    textAlign: 'center',
  },
} as const;

/** Per-cell layout; only the non-last cell gets a right divider. */
export const cellSx = (isLast: boolean): SxProps<Theme> => ({
  flex: 1,
  padding: 1,
  alignItems: 'center',
  justifyContent: 'center',
  borderRight: isLast ? 'none' : '1px solid',
  borderColor: 'divider',
});
