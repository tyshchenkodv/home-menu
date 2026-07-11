import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  row: { alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: '1.125rem' },
  quantityRow: { alignItems: 'center', flexWrap: 'wrap' },
};
