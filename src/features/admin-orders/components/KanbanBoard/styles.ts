import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  board: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    overflowX: 'auto',
    width: '100%',
    pb: 1,
  },
};
