import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  body: { pt: 1 },
  /** Centered round "!" badge on `error.light` per dialog 6 (05e·6). */
  iconBadge: (theme: Theme) => ({
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    mb: 1,
    bgcolor: theme.palette.error.light,
    color: theme.palette.error.dark,
    fontWeight: theme.typography.fontWeightBold,
  }),
};
