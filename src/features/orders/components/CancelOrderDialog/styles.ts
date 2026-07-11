import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  errorText: { mt: 1 },
  iconBadge: (theme: Theme) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: theme.palette.error.light,
    // `error.light` is a light pink, so the badge glyph uses `error.dark` (as
    // the sibling Archive/Discard dialogs do); `error.contrastText` is white,
    // which read poorly on the pastel fill. Both come from `theme.palette`
    // (light-scheme frozen), so the badge is identical in both color schemes.
    color: theme.palette.error.dark,
    fontWeight: theme.typography.fontWeightBold,
    mb: 1,
  }),
};
