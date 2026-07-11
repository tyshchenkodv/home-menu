import type { SxProps, Theme } from '@mui/material/styles';

import { DRAWER_WIDTH } from '../AppShell/components/AppNavDrawer/styles';

export const styles: Record<string, SxProps<Theme>> = {
  toolbar: { alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  // At `md`+ the permanent navigation drawer sits full-height over the header's
  // left edge, so offset the brand by the drawer width to clear it — the app
  // name lines up above the page content instead of being hidden behind the
  // drawer. Below `md` the drawer is a temporary overlay, so no offset applies.
  brand: { display: 'flex', alignItems: 'center', gap: 1, ml: { md: `${String(DRAWER_WIDTH)}px` } },
  mark: { display: 'flex', color: 'primary.main' },
  wordmark: { fontWeight: 700 },
  menuButton: { mr: 1 },
};
