import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  list: { m: 0, pl: 3, display: 'flex', flexDirection: 'column', gap: 1.5 },
  item: { display: 'flex', flexDirection: 'column' },
  title: { fontWeight: 600, display: 'block' },
};
