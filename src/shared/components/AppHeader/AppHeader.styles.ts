import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  toolbar: { alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  brand: { display: 'flex', alignItems: 'center', gap: 1 },
  mark: { display: 'flex', color: 'primary.main' },
  wordmark: { fontWeight: 700 },
  actions: { display: 'flex', alignItems: 'center', gap: 1 },
};
