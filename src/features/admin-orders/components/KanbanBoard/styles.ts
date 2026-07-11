import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  // Desktop (`md`+): a row of columns that share the available width between
  // the drawer and the right edge. Mobile (< `md`): a single vertical stack
  // of collapsible sections, so the board scrolls with the page instead of
  // scrolling horizontally. Columns stretch to full width on mobile and
  // top-align on desktop.
  board: {
    alignItems: { xs: 'stretch', md: 'flex-start' },
    width: '100%',
  },
  // The separator between adjacent statuses. `flexItem` stretches it along the
  // container cross axis, so the same element renders as a full-width
  // horizontal rule between mobile sections and a full-height vertical rule
  // between desktop columns; the border side flips at the `md` breakpoint.
  divider: {
    borderColor: 'divider',
    borderBottomWidth: { xs: 'thin', md: 0 },
    borderRightWidth: { xs: 0, md: 'thin' },
  },
};
