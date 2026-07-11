import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  column: { minWidth: 280, flex: '0 0 280px' },
  headerRow: { alignItems: 'center' },
  columnTitle: { fontWeight: 700 },
};

/** Column-header status dot: fixed shape, per-status fill color. */
export const dotSx = (color: string): SxProps<Theme> => ({
  width: 9,
  height: 9,
  borderRadius: '50%',
  bgcolor: color,
});
