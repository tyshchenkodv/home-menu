import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  // Desktop (`md`+): each column takes an equal share of the board width
  // (`flex: 1`), with `minWidth: 0` so long content can shrink instead of
  // forcing horizontal overflow. Mobile (< `md`): a full-width stacked
  // section.
  column: { flex: { md: 1 }, minWidth: 0, width: '100%' },
  headerRow: { alignItems: 'center' },
  columnTitle: { fontWeight: 700 },
  // Mobile-only tappable header: the status heading on the left, the chevron
  // on the right, spanning the full section width.
  toggle: {
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 1,
    px: 0.5,
    py: 0.5,
  },
  chevron: {
    color: 'text.secondary',
    transition: 'transform 150ms ease',
  },
};

/** Column-header status dot: fixed shape, per-status fill color. */
export const dotSx = (color: string): SxProps<Theme> => ({
  width: 9,
  height: 9,
  borderRadius: '50%',
  bgcolor: color,
});
