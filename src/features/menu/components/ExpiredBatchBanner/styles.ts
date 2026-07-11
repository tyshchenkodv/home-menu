import type { SxProps, Theme } from '@mui/material/styles';

import { lightSchemeInk } from '../../../../shared/theme/pastelInk';

// The card fill is `error.light`, a light pink in both schemes, so the title
// and body copy are pinned to fixed light-scheme inks — the flipping tokens
// (`error.dark`, `text.secondary`) would turn too light / near-white and read
// poorly on the pastel in dark mode.
export const styles: Record<string, SxProps<Theme>> = {
  card: {
    p: 2,
    borderRadius: '18px',
    border: '1px solid',
    borderColor: 'error.main',
    bgcolor: 'error.light',
  },
  titleRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 1,
  },
  title: {
    color: (theme: Theme) => lightSchemeInk(theme, palette => palette.error.dark, 'rgb(159, 65, 65)'),
  },
  body: {
    color: (theme: Theme) => lightSchemeInk(theme, palette => palette.text.secondary, '#7A6B72'),
  },
  footer: {
    justifyContent: 'flex-end',
    mt: 1,
  },
};
