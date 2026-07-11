import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
    gap: 2,
  },
};

/** Per-color tile background/border, plus hover feedback only when the tile is clickable. */
export const tileSx = (color: string, clickable: boolean): SxProps<Theme> => ({
  padding: 2,
  textAlign: 'center',
  cursor: clickable ? 'pointer' : 'default',
  borderColor: `${color}.light`,
  backgroundColor: `rgba(var(--mui-palette-${color}-mainChannel), 0.04)`,
  '&:hover': clickable
    ? {
        backgroundColor: `rgba(var(--mui-palette-${color}-mainChannel), 0.08)`,
      }
    : undefined,
});

/** Per-color tile count text. */
export const tileCountSx = (color: string): SxProps<Theme> => ({
  color: `${color}.main`,
  fontWeight: 600,
});
