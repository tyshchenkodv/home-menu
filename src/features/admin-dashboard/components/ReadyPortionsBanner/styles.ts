import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

import { lightSchemeInk } from '../../../../shared/theme/pastelInk';

/** Solid success-tinted full-width banner; hover feedback only when clickable. */
export const bannerSx =
  (clickable: boolean): SxProps<Theme> =>
  theme => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    width: '100%',
    padding: 3,
    borderRadius: '24px',
    textAlign: 'left',
    font: 'inherit',
    border: 'none',
    cursor: clickable ? 'pointer' : 'default',
    color: theme.palette.success.dark,
    backgroundColor: theme.palette.success.light,
    transition: 'background-color 120ms ease',
    '&:hover': clickable ? { backgroundColor: alpha(theme.palette.success.main, 0.35) } : undefined,
  });

// The banner fill is the frozen light-scheme `success.light`, so the count and
// label are pinned to the matching light-scheme `success.dark` — the flipping
// `success.dark` token would lighten in dark mode and lose contrast on the
// unchanged pastel fill.
export const countSx: SxProps<Theme> = {
  color: (theme: Theme) => lightSchemeInk(theme, palette => palette.success.dark, 'rgb(44, 129, 98)'),
  fontWeight: 900,
  fontSize: '2.75rem',
  lineHeight: 1,
};

export const labelSx: SxProps<Theme> = {
  color: (theme: Theme) => lightSchemeInk(theme, palette => palette.success.dark, 'rgb(44, 129, 98)'),
  fontWeight: 700,
};
