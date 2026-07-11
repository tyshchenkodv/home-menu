import type { SxProps, Theme } from '@mui/material/styles';

export const styles = {
  card: {
    p: 2,
    borderRadius: '18px',
    border: '1px solid',
    borderColor: 'divider',
  } satisfies SxProps<Theme>,
  titleRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 1,
  } satisfies SxProps<Theme>,
  title: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } satisfies SxProps<Theme>,
  chip: {
    flex: 'none',
  } satisfies SxProps<Theme>,
  footer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    mt: 1,
  } satisfies SxProps<Theme>,
};
