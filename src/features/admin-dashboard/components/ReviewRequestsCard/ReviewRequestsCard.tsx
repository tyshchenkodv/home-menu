import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import type { Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { lightSchemeInk } from '../../../../shared/theme/pastelInk';
import { cardSx } from './styles';

interface ReviewRequestsCardProps {
  pendingRequests: number;
}

/**
 * "Review cooking requests" quick-action row from
 * docs/design/screens/admin-dashboard.md: a full-width outlined row badged
 * with the pending-request count, linking to the cooking-requests board. The
 * screenshot's "Manage" navigation grid is intentionally omitted — the left
 * navigation drawer is the single navigation surface (`navigation-drawer-signout`).
 */
export const ReviewRequestsCard = ({ pendingRequests }: ReviewRequestsCardProps) => {
  const { t } = useTranslation();

  return (
    <Paper elevation={0} component={Link} to="/admin/orders" sx={cardSx}>
      <Typography component="span" sx={{ fontWeight: 700 }}>
        {t('dashboard.reviewRequests')}
      </Typography>
      <Chip
        label={pendingRequests}
        size="small"
        // `primary.light` stays a light pink in both schemes; pin the count ink
        // to the light-scheme `primary.dark` so it stays legible in dark mode.
        sx={{
          backgroundColor: 'primary.light',
          color: (theme: Theme) => lightSchemeInk(theme, palette => palette.primary.dark, '#B8446F'),
          fontWeight: 700,
        }}
      />
    </Paper>
  );
};
