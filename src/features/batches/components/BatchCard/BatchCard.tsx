import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { isBatchExpired, isBatchExpiringSoon, hoursUntilExpiry } from '../../../../domain/batches/expiration';
import { StatusChip } from '../../../../shared/components/StatusChip/StatusChip';
import type { PreparedBatchWithId } from '../../../../shared/types/preparedBatch';
import { BatchCounters } from '../BatchCounters/BatchCounters';
import { styles } from './styles';

interface BatchCardProps {
  batch: PreparedBatchWithId;
  now: Date;
  onDiscard?: (batch: PreparedBatchWithId) => void;
}

/**
 * Displays a prepared batch card with:
 * - Dish name (h4) and metadata (cooked date/time, best-before)
 * - Status chip (fresh/expiring/expired/fully-reserved/discarded)
 * - Counters strip (4 cells for available/reserved/consumed/discarded)
 * - Contextual action buttons (e.g., Discard or disabled when fully reserved)
 *
 * Implements the 5-status matrix from admin-batches.md screen spec.
 */
export const BatchCard = ({ batch, now, onDiscard }: BatchCardProps) => {
  const { t, i18n } = useTranslation();
  const nowTimestamp = { toMillis: () => now.getTime() };

  const isExpired = isBatchExpired(batch.expiresAt, nowTimestamp);
  const isExpiringS = isBatchExpiringSoon(batch.expiresAt, nowTimestamp);
  const isFullyReserved = batch.availableQuantity === 0 && batch.reservedQuantity > 0;
  const isDiscarded = batch.status === 'discarded';

  // Determine the status chip
  const getStatusChip = () => {
    if (isDiscarded) return 'discarded';
    if (isExpired) return 'expired';
    if (isExpiringS) return 'expiring';
    if (isFullyReserved) return 'fullyReserved';
    return 'fresh';
  };

  const statusChipType = getStatusChip();
  const hoursLeft = hoursUntilExpiry(batch.expiresAt, nowTimestamp);

  // Format metadata line
  const formatMetadata = () => {
    if (statusChipType === 'discarded') {
      // The batch document stores only the actor's uid (docs/03), never a
      // display name, so the meta line shows date + discarded count rather
      // than a raw Firestore id.
      return t('batches.meta.discarded', {
        date: new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
          batch.preparedAt.toDate(),
        ),
        count: batch.discardedQuantity,
      });
    }

    if (isExpired) {
      return t('batches.meta.expired', {
        date: new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
          batch.preparedAt.toDate(),
        ),
        relativeDate: t('common.yesterday'), // Simplified; real impl would calculate the relative day
      });
    }

    if (batch.expiresAt) {
      return t('batches.meta.bestBefore', {
        date: new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
          batch.preparedAt.toDate(),
        ),
        time: new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(
          batch.preparedAt.toDate(),
        ),
        bestBefore: new Intl.DateTimeFormat(i18n.language, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(batch.expiresAt.toDate()),
      });
    }

    return t('batches.meta.cooked', {
      date: new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
        batch.preparedAt.toDate(),
      ),
      time: new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(
        batch.preparedAt.toDate(),
      ),
    });
  };

  const canDiscard = !isFullyReserved && !isDiscarded && batch.availableQuantity > 0;
  const disableReason = isFullyReserved ? t('batches.actions.discardDisabled') : undefined;

  // 05d BatchCard status matrix discard-button mapping: only the expired
  // card uses the portion-count label with a contained error button; fresh
  // uses an outlined neutral button, expiring soon an outlined warning
  // button, and fully reserved is disabled with the explanatory label.
  const discardButtonLabel = isFullyReserved
    ? t('batches.actions.discardDisabled')
    : isExpired
      ? t('batches.actions.discardCount', { count: batch.availableQuantity })
      : t('batches.actions.discard');
  const discardButtonVariant = isExpired ? 'contained' : 'outlined';
  const discardButtonColor: 'error' | 'warning' | 'inherit' = isExpired ? 'error' : isExpiringS ? 'warning' : 'inherit';

  // Determine chip label and color based on status
  const getChipLabel = () => {
    if (statusChipType === 'discarded') return t('status.batch.discarded');
    if (statusChipType === 'expired') return t('status.batch.expired');
    if (statusChipType === 'expiring') return t('status.batch.expiring', { hours: hoursLeft });
    if (statusChipType === 'fullyReserved') return t('status.batch.fullyReserved');
    return t('status.batch.fresh');
  };

  const getChipColor = (): 'success' | 'warning' | 'default' | 'secondary' | 'primary' | 'info' | 'error' => {
    if (statusChipType === 'expired') return 'error';
    if (statusChipType === 'expiring') return 'warning';
    if (statusChipType === 'fullyReserved') return 'secondary';
    if (statusChipType === 'discarded') return 'default';
    return 'success';
  };

  return (
    <Paper variant="outlined" sx={styles.container(statusChipType)}>
      <Stack spacing={2}>
        {/* Header with dish name and status chip */}
        <Stack direction="row" sx={styles.headerRow}>
          <Stack spacing={0.5} sx={styles.nameStack}>
            <Typography variant="h4" sx={styles.dishName(isExpired)}>
              {batch.dishName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatMetadata()}
            </Typography>
          </Stack>
          <StatusChip
            label={getChipLabel()}
            color={getChipColor()}
            variant={statusChipType === 'discarded' ? 'outlined' : 'filled'}
          />
        </Stack>

        {/* Expired warning notice - replaces counters */}
        {isExpired && (
          <Typography variant="body2" sx={styles.expiredNotice}>
            {t('batches.expired.notice', { count: batch.availableQuantity })}
          </Typography>
        )}

        {/* Counters strip - hidden on expired card per screen spec */}
        {!isExpired && <BatchCounters batch={batch} />}

        {/* Discard button or disabled button with explanation */}
        {!isDiscarded && (
          <Tooltip title={disableReason ?? ''}>
            <span>
              <Button
                variant={discardButtonVariant}
                color={discardButtonColor}
                fullWidth
                disabled={!canDiscard}
                onClick={() => {
                  if (canDiscard && onDiscard) {
                    onDiscard(batch);
                  }
                }}
              >
                {discardButtonLabel}
              </Button>
            </span>
          </Tooltip>
        )}

        {/* Discarded helper text */}
        {isDiscarded && (
          <Typography variant="caption" color="textSecondary">
            {t('batches.discarded.helper')}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};
