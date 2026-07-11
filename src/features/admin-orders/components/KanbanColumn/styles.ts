import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  // Fixed-width column that neither grows nor shrinks, so an empty column
  // keeps its configured width instead of collapsing, and all 4 columns lay
  // out at full width on desktop without clipping.
  column: { flex: '0 0 280px', minWidth: 280, maxWidth: 280 },
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
