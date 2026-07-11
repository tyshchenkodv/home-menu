import { type SxProps, type Theme } from '@mui/material';

export const styles = {
  container: (statusType: string): SxProps<Theme> => ({
    padding: 2,
    borderRadius: 2,
    ...(statusType === 'expiring' && {
      borderColor: 'warning.light',
      backgroundColor: 'rgba(var(--mui-palette-warning-mainChannel), 0.08)',
    }),
    ...(statusType === 'expired' && {
      borderColor: 'error.light',
      backgroundColor: 'rgba(var(--mui-palette-error-mainChannel), 0.08)',
    }),
    ...(statusType === 'fullyReserved' && {
      borderColor: 'secondary.light',
    }),
    ...(statusType === 'discarded' && {
      opacity: 0.6,
      borderStyle: 'dashed',
    }),
  }),
  dishName: (isExpired: boolean): SxProps<Theme> => ({
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    ...(isExpired && { color: 'error.dark' }),
  }),
  expiredNotice: {
    color: 'error.dark',
    padding: 1,
    backgroundColor: 'rgba(var(--mui-palette-error-mainChannel), 0.12)',
    borderRadius: 1,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameStack: {
    flex: 1,
  },
} as const;
