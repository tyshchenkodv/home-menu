import type { SxProps, Theme } from '@mui/material/styles';

export const DRAWER_WIDTH = 240;

export const styles: Record<string, SxProps<Theme>> = {
  drawer: {
    width: DRAWER_WIDTH,
    flexShrink: 0,
    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
  },
  itemActive: { color: 'primary.main', bgcolor: 'action.selected' },
};
