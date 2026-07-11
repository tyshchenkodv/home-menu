import type { SxProps, Theme } from '@mui/material/styles';

export const styles = {
  dateRow: {
    overflowX: 'auto',
    flexWrap: 'nowrap',
    pb: 0.5,
  } satisfies SxProps<Theme>,
  dateChip: {
    flex: 'none',
  } satisfies SxProps<Theme>,
};
