import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  container: { minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', px: 2, py: 8 },
  code: { fontWeight: 900, color: 'primary.dark' },
};
