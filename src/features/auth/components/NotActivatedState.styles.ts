import type { SxProps, Theme } from '@mui/material/styles';

import { lightSchemeInk } from '../../../shared/theme/pastelInk';

export const styles: Record<string, SxProps<Theme>> = {
  container: { py: 8, px: 2, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  // `secondary.light` stays a light lavender in both schemes, so the copy is
  // pinned to the light-scheme `text.secondary` rather than the flipping token,
  // which would turn near-white and vanish on the pastel in dark mode.
  info: {
    bgcolor: 'secondary.light',
    borderRadius: 2,
    px: 2,
    py: 1.5,
    color: (theme: Theme) => lightSchemeInk(theme, palette => palette.text.secondary, '#7A6B72'),
  },
};
