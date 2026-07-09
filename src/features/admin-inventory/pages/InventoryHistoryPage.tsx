import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import type { BaseUnit } from '../../../domain/inventory/types';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { IngredientFilter } from '../components/IngredientFilter/IngredientFilter';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { MovementList } from '../components/MovementList/MovementList';
import { useAllIngredients } from '../hooks/useAllIngredients';
import { useInventoryMovements } from '../hooks/useInventoryMovements';
import { styles } from './InventoryHistoryPage.styles';

/**
 * Append-only inventory movement history: an ingredient filter (preselected
 * from the `?ingredientId=` search param set by per-ingredient history links
 * on the inventory page) narrows the `useInventoryMovements` subscription,
 * and the filter selection is written back to the URL so it stays
 * shareable/bookmarkable.
 */
export const InventoryHistoryPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const ingredientId = searchParams.get('ingredientId') ?? undefined;

  const { ingredients: allIngredients } = useAllIngredients();
  const { status, movements } = useInventoryMovements(ingredientId);

  const baseUnitByIngredientId = useMemo(
    () => new Map<string, BaseUnit>(allIngredients.map(ingredient => [ingredient.id, ingredient.baseUnit])),
    [allIngredients],
  );

  const handleFilterChange = (nextIngredientId: string) => {
    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous);

        if (nextIngredientId) {
          next.set('ingredientId', nextIngredientId);
        } else {
          next.delete('ingredientId');
        }

        return next;
      },
      { replace: true },
    );
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <LoadingState message={t('inventory.history.loading')} />;
    }

    if (status === 'error') {
      return <ErrorState message={t('inventory.history.error')} />;
    }

    if (movements.length === 0) {
      return <EmptyState message={t('inventory.history.empty')} />;
    }

    return <MovementList movements={movements} baseUnitByIngredientId={baseUnitByIngredientId} />;
  };

  return (
    <Stack spacing={2} sx={styles.page}>
      <Stack direction="row" sx={styles.header}>
        <Typography variant="h1">{t('inventory.history.title')}</Typography>
        <Button component={RouterLink} to="/admin/inventory" startIcon={<ArrowBackIcon />}>
          {t('inventory.history.backToInventory')}
        </Button>
      </Stack>

      <IngredientFilter ingredients={allIngredients} value={ingredientId ?? ''} onChange={handleFilterChange} />

      {renderContent()}
    </Stack>
  );
};
