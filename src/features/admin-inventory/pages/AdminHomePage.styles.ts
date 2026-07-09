import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  page: { p: 2, maxWidth: 480 },
  cardRow: { alignItems: 'center' },
  cardTitle: { fontSize: '1.125rem' },
};
