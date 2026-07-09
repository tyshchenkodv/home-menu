import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HistoryIcon from '@mui/icons-material/History';
import RuleIcon from '@mui/icons-material/Rule';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { isLowStock } from '../../../domain/inventory/isLowStock';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import type { InventoryTab } from '../types/inventoryTab';
import { formatIngredientQuantity } from '../utils/formatIngredientQuantity';
import { LowStockChip } from './LowStockChip';

interface IngredientCardProps {
  ingredient: IngredientWithId;
  tab: InventoryTab;
  onEdit: (ingredient: IngredientWithId) => void;
  onArchive: (ingredient: IngredientWithId) => void;
  onRestore: (ingredient: IngredientWithId) => void;
  onRestock: (ingredient: IngredientWithId) => void;
  onCorrect: (ingredient: IngredientWithId) => void;
  onMarkPresent: (ingredient: IngredientWithId) => void;
  onMarkAbsent: (ingredient: IngredientWithId) => void;
}

/** One ingredient's mobile-first card: quantity/presence, low-stock chip, and actions. */
export const IngredientCard = ({
  ingredient,
  tab,
  onEdit,
  onArchive,
  onRestore,
  onRestock,
  onCorrect,
  onMarkPresent,
  onMarkAbsent,
}: IngredientCardProps) => {
  const { t } = useTranslation();
  const display = formatIngredientQuantity(ingredient);

  const quantityText =
    display.kind === 'presence'
      ? t(display.isPresent ? 'inventory.presence.present' : 'inventory.presence.absent')
      : t('inventory.quantityWithUnit', { amount: display.amount, unit: t(`inventory.units.${display.unit}`) });

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack spacing={0.5}>
            <Typography variant="h2" sx={{ fontSize: '1.125rem' }}>
              {ingredient.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography color="text.secondary">{quantityText}</Typography>
              {isLowStock(ingredient) && <LowStockChip label={t('inventory.lowStock.label')} />}
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton
              component={RouterLink}
              to={`/admin/inventory/history?ingredientId=${ingredient.id}`}
              aria-label={t('inventory.actions.historyFor', { name: ingredient.name })}
              size="small"
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => {
                onEdit(ingredient);
              }}
              aria-label={t('inventory.actions.editFor', { name: ingredient.name })}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            {ingredient.trackingMode === 'quantity' ? (
              <>
                <IconButton
                  onClick={() => {
                    onRestock(ingredient);
                  }}
                  aria-label={t('inventory.actions.restockFor', { name: ingredient.name })}
                  size="small"
                >
                  <AddCircleOutlineIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => {
                    onCorrect(ingredient);
                  }}
                  aria-label={t('inventory.actions.correctFor', { name: ingredient.name })}
                  size="small"
                >
                  <RuleIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton
                  onClick={() => {
                    onMarkPresent(ingredient);
                  }}
                  aria-label={t('inventory.actions.markPresentFor', { name: ingredient.name })}
                  size="small"
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => {
                    onMarkAbsent(ingredient);
                  }}
                  aria-label={t('inventory.actions.markAbsentFor', { name: ingredient.name })}
                  size="small"
                >
                  <HighlightOffIcon fontSize="small" />
                </IconButton>
              </>
            )}
            {tab === 'active' ? (
              <IconButton
                onClick={() => {
                  onArchive(ingredient);
                }}
                aria-label={t('inventory.actions.archiveFor', { name: ingredient.name })}
                size="small"
              >
                <ArchiveIcon fontSize="small" />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => {
                  onRestore(ingredient);
                }}
                aria-label={t('inventory.actions.restoreFor', { name: ingredient.name })}
                size="small"
              >
                <UnarchiveIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
