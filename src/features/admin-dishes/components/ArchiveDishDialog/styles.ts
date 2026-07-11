import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  iconBadge: (theme: Theme) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: theme.palette.warning.light,
    color: theme.palette.warning.dark,
    mb: 1,
  }),
};
