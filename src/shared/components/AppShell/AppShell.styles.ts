import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  root: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  body: { display: 'flex', flex: 1, minWidth: 0 },
  // `minWidth: 0` lets this flex column shrink below its content's intrinsic
  // width, so wide children (e.g. the orders Kanban) scroll inside their own
  // `overflow-x: auto` container instead of widening the whole page on mobile.
  content: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  main: { flex: 1, p: 2, minWidth: 0 },
};
