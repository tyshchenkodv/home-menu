import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HistoryIcon from '@mui/icons-material/History';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RuleIcon from '@mui/icons-material/Rule';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import type { IngredientCardProps } from '../../../../types/ingredientCardProps';
import { formatIngredientQuantity } from '../../../../utils/formatIngredientQuantity';
import { getIngredientStatus } from '../../../../utils/ingredientStatus';
import { StatusChip } from '../../../../../../shared/components/StatusChip/StatusChip';
import { styles } from './styles';

/** One ingredient's mobile-first card: quantity/presence, status chip, and an actions menu. */
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
  const status = getIngredientStatus(ingredient);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const isMenuOpen = menuAnchor !== null;

  const quantityText =
    display.kind === 'presence'
      ? t(display.isPresent ? 'inventory.presence.present' : 'inventory.presence.absent')
      : t('inventory.quantityWithUnit', { amount: display.amount, unit: t(`inventory.units.${display.unit}`) });

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const runAction = (action: () => void) => () => {
    closeMenu();
    action();
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} sx={styles.row}>
          <Stack spacing={0.5}>
            <Typography variant="h2" sx={styles.title}>
              {ingredient.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={styles.quantityRow}>
              <Typography color="text.secondary">{quantityText}</Typography>
              <StatusChip label={t(status.labelKey)} color={status.color} />
            </Stack>
          </Stack>
          <IconButton
            onClick={openMenu}
            aria-label={t('inventory.actions.moreFor', { name: ingredient.name })}
            aria-haspopup="true"
            aria-expanded={isMenuOpen ? 'true' : undefined}
            size="small"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={isMenuOpen} onClose={closeMenu}>
            <MenuItem
              component={RouterLink}
              to={`/admin/inventory/history?ingredientId=${ingredient.id}`}
              onClick={closeMenu}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('inventory.actions.historyFor', { name: ingredient.name })}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={runAction(() => {
                onEdit(ingredient);
              })}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('inventory.actions.editFor', { name: ingredient.name })}</ListItemText>
            </MenuItem>
            {ingredient.trackingMode === 'quantity'
              ? [
                  <MenuItem
                    key="restock"
                    onClick={runAction(() => {
                      onRestock(ingredient);
                    })}
                  >
                    <ListItemIcon>
                      <AddCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('inventory.actions.restockFor', { name: ingredient.name })}</ListItemText>
                  </MenuItem>,
                  <MenuItem
                    key="correct"
                    onClick={runAction(() => {
                      onCorrect(ingredient);
                    })}
                  >
                    <ListItemIcon>
                      <RuleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('inventory.actions.correctFor', { name: ingredient.name })}</ListItemText>
                  </MenuItem>,
                ]
              : [
                  <MenuItem
                    key="markPresent"
                    onClick={runAction(() => {
                      onMarkPresent(ingredient);
                    })}
                  >
                    <ListItemIcon>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('inventory.actions.markPresentFor', { name: ingredient.name })}</ListItemText>
                  </MenuItem>,
                  <MenuItem
                    key="markAbsent"
                    onClick={runAction(() => {
                      onMarkAbsent(ingredient);
                    })}
                  >
                    <ListItemIcon>
                      <HighlightOffIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('inventory.actions.markAbsentFor', { name: ingredient.name })}</ListItemText>
                  </MenuItem>,
                ]}
            {tab === 'active' ? (
              <MenuItem
                onClick={runAction(() => {
                  onArchive(ingredient);
                })}
              >
                <ListItemIcon>
                  <ArchiveIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('inventory.actions.archiveFor', { name: ingredient.name })}</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem
                onClick={runAction(() => {
                  onRestore(ingredient);
                })}
              >
                <ListItemIcon>
                  <UnarchiveIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('inventory.actions.restoreFor', { name: ingredient.name })}</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </Stack>
      </CardContent>
    </Card>
  );
};
