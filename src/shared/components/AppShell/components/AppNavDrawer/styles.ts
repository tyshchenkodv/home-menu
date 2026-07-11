import type { SxProps, Theme } from '@mui/material/styles';

export const DRAWER_WIDTH = 240;

export const styles: Record<string, SxProps<Theme>> = {
  drawer: {
    width: DRAWER_WIDTH,
    flexShrink: 0,
    '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
  },
  nav: { display: 'flex', flexDirection: 'column', height: '100%' },
  itemActive: { color: 'primary.main', bgcolor: 'action.selected' },
  itemIconActive: { color: 'primary.main' },
  spacer: { flex: 1 },
  preferences: { px: 2, py: 1 },
  identity: { px: 2, py: 1, wordBreak: 'break-word' },
};
