import type { SxProps, Theme } from '@mui/material/styles';

import { lightSchemeInk } from '../../../../shared/theme/pastelInk';

export const styles: Record<string, SxProps<Theme>> = {
  card: {
    borderRadius: 2,
    p: 2,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    mb: 2,
    '&:last-of-type': {
      mb: 0,
    },
  },
  mealChipBreakfast: {
    minWidth: 100,
    fontWeight: 600,
    backgroundColor: 'var(--mui-palette-warning-main)',
    color: 'var(--mui-palette-warning-contrastText)',
  },
  mealChipLunch: {
    minWidth: 100,
    fontWeight: 600,
    backgroundColor: 'var(--mui-palette-success-main)',
    color: 'var(--mui-palette-success-contrastText)',
  },
  mealChipDinner: {
    minWidth: 100,
    fontWeight: 600,
    backgroundColor: 'var(--mui-palette-secondary-main)',
    color: 'var(--mui-palette-secondary-contrastText)',
  },
  timeInput: {
    flex: 1,
    maxWidth: 120,
    '& input': {
      fontSize: '1rem',
    },
  },
  loadingStack: {
    alignItems: 'center',
    justifyContent: 'center',
    py: 3,
  },
  savingSpinner: {
    mr: 1,
  },
  // `info.light` stays a light blue in both schemes; pin the text to the
  // light-scheme `info.dark` so it never flips to a too-light tone in dark mode.
  banner: {
    p: 2,
    mb: 2,
    borderRadius: 1,
    backgroundColor: 'var(--mui-palette-info-light)',
    color: (theme: Theme) => lightSchemeInk(theme, palette => palette.info.dark, 'rgb(62, 118, 161)'),
  },
  helper: {
    mt: 1.5,
    fontSize: '0.875rem',
    color: 'var(--mui-palette-text-secondary)',
    lineHeight: 1.5,
  },
  buttonRow: {
    display: 'flex',
    gap: 1,
    justifyContent: 'flex-end',
    mt: 2,
  },
};
