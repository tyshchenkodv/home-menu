import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DishWithId } from '../../../shared/types/dish';
import { useAuth } from '../../auth/useAuth';
import { ArchiveDishDialog } from '../components/ArchiveDishDialog/ArchiveDishDialog';
import { DishesTabs } from '../components/DishesTabs/DishesTabs';
import { DishFormDialog } from '../components/DishFormDialog/DishFormDialog';
import { DishList } from '../components/DishList/DishList';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { useActiveIngredientsForRecipes } from '../hooks/useActiveIngredientsForRecipes';
import { useDishCommands } from '../hooks/useDishCommands';
import { useDishes } from '../hooks/useDishes';
import type { DishFormSubmitPayload } from '../types/dishFormSubmitPayload';
import type { DishesTab } from '../types/dishesTab';
import { recipeItemsToRows } from '../utils/recipeItemsToRows';
import { styles } from './DishesPage.styles';

type DialogState = { mode: 'create' } | { mode: 'edit'; dish: DishWithId };

export const DishesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const [tab, setTab] = useState<DishesTab>('active');
  const [retryToken, setRetryToken] = useState(0);
  const { status, dishes } = useDishes(tab, retryToken);
  const { ingredients } = useActiveIngredientsForRecipes();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<DishWithId | null>(null);
  const commands = useDishCommands();

  const submitDialog = async (payload: DishFormSubmitPayload) => {
    if (payload.mode === 'create') {
      await commands.create(payload.input, uid);
    } else if (dialogState?.mode === 'edit') {
      await commands.update(dialogState.dish.id, payload.input, uid);
    }

    setDialogState(null);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) {
      return;
    }

    await commands.archive(archiveTarget.id, uid);
    setArchiveTarget(null);
    setDialogState(null);
  };

  const handleRestore = (dish: DishWithId) => {
    void commands.restore(dish.id, uid);
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <LoadingState message={t('dishes.loading')} />;
    }

    if (status === 'error') {
      return (
        <ErrorState
          message={t('dishes.error.title')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setRetryToken(token => token + 1);
          }}
        />
      );
    }

    if (dishes.length === 0) {
      return (
        <EmptyState
          title={t('dishes.empty.title')}
          message={t('dishes.empty.body')}
          actionLabel={t('dishes.empty.action')}
          onAction={() => {
            setDialogState({ mode: 'create' });
          }}
        />
      );
    }

    return (
      <DishList
        dishes={dishes}
        tab={tab}
        ingredients={ingredients}
        onEdit={dish => {
          setDialogState({ mode: 'edit', dish });
        }}
        onArchive={dish => {
          setArchiveTarget(dish);
        }}
        onRestore={handleRestore}
      />
    );
  };

  return (
    <Stack spacing={2} sx={styles.page}>
      <Stack direction="row" sx={styles.header}>
        <Typography variant="h1">{t('dishes.title')}</Typography>
      </Stack>

      <DishesTabs value={tab} onChange={setTab} />

      <Stack sx={styles.content}>{renderContent()}</Stack>

      <Fab
        color="primary"
        aria-label={t('dishes.empty.action')}
        sx={styles.fab}
        onClick={() => {
          setDialogState({ mode: 'create' });
        }}
      >
        <AddIcon />
      </Fab>

      {dialogState && (
        <DishFormDialog
          open
          mode={dialogState.mode}
          availableIngredients={ingredients}
          initialValues={
            dialogState.mode === 'edit'
              ? {
                  name: dialogState.dish.name,
                  description: dialogState.dish.description,
                  mealTypes: dialogState.dish.mealTypes,
                  recipeRows: recipeItemsToRows(dialogState.dish.recipeItems, ingredients),
                }
              : { name: '', description: '', mealTypes: [], recipeRows: [] }
          }
          onCancel={() => {
            setDialogState(null);
          }}
          onSubmit={submitDialog}
          onRequestArchive={
            dialogState.mode === 'edit'
              ? () => {
                  setArchiveTarget(dialogState.dish);
                }
              : undefined
          }
        />
      )}

      <ArchiveDishDialog
        open={archiveTarget !== null}
        dishName={archiveTarget?.name ?? ''}
        onConfirm={() => void handleArchiveConfirm()}
        onCancel={() => {
          setArchiveTarget(null);
        }}
      />
    </Stack>
  );
};
