import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';

/**
 * `docs/design/screens/shared-patterns.md` 05e: "Dialog on md+, bottom-sheet
 * on mobile". Below `md` the paper is pinned to the bottom of the viewport,
 * full width, with only the top corners rounded; at `md`+ it reverts to the
 * default centered MUI dialog paper.
 */
const BOTTOM_SHEET_PAPER_SX: SxProps<Theme> = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  m: 0,
  width: '100%',
  maxWidth: '100%',
  borderRadius: 0,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
};

/** Pure helper (testable without mounting a component/mocking matchMedia). */
export const getBottomSheetPaperProps = (isMobile: boolean): { sx: SxProps<Theme> } => ({
  sx: isMobile ? BOTTOM_SHEET_PAPER_SX : {},
});

/**
 * Hook returning the MUI `Dialog` `slotProps.paper` value that renders a
 * bottom-sheet below `md` and a centered modal at `md`+, per T5.10.
 */
export const useBottomSheetDialogPaperProps = (): { sx: SxProps<Theme> } => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return getBottomSheetPaperProps(isMobile);
};
