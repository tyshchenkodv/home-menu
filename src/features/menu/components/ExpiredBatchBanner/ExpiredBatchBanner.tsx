import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { ExpiredBatchBannerProps } from '../../types/expiredBatchBannerProps';
import { styles } from './styles';

const ADMIN_BATCHES_ROUTE = '/admin/batches';

/**
 * Admin-only banner for the menu-browse screen (`docs/design/screens/menu-browse.md`
 * "Edge cases (05h)"): tells an admin that a dish's backing batch has expired
 * and its portions are awaiting discarding, with a CTA to the Batches screen.
 * Availability is deliberately unaffected — this is read-only and
 * navigational (`docs/specifications/menu-expired-batch-banner/SPEC.md`).
 * The earliest expired batch's `preparedAt` anchors the body copy when
 * several backing batches are expired.
 */
export const ExpiredBatchBanner = ({ batches }: ExpiredBatchBannerProps) => {
  const { t, i18n } = useTranslation();

  const earliestBatch = batches.reduce((earliest, batch) =>
    batch.preparedAt.toMillis() < earliest.preparedAt.toMillis() ? batch : earliest,
  );
  const totalExpiredPortions = batches.reduce((sum, batch) => sum + batch.availableQuantity, 0);
  const date = new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
    earliestBatch.preparedAt.toMillis(),
  );

  return (
    <Stack sx={styles.card} spacing={1} data-testid="expired-batch-banner">
      <Stack direction="row" sx={styles.titleRow}>
        <Typography variant="h4" component="h3" sx={styles.title}>
          {t('menu.expiredBanner.title')}
        </Typography>
        <Chip color="error" size="small" label={t('menu.expiredBanner.chip')} />
      </Stack>

      <Typography variant="body2" sx={styles.body}>
        {t('menu.expiredBanner.body', { date, count: totalExpiredPortions })}
      </Typography>

      <Stack direction="row" sx={styles.footer}>
        <Button variant="contained" color="error" component={Link} to={ADMIN_BATCHES_ROUTE}>
          {t('menu.expiredBanner.cta')}
        </Button>
      </Stack>
    </Stack>
  );
};
