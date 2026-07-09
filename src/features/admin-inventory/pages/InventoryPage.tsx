import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  archiveIngredient,
  createIngredient,
  restoreIngredient,
  updateIngredient,
} from '../../../infrastructure/firebase/services/ingredientService';
import type { IngredientWithId } from '../../../shared/types/ingredient';
import { useAuth } from '../../auth/useAuth';
import { ArchiveConfirmDialog } from '../components/ArchiveConfirmDialog/ArchiveConfirmDialog';
import { CorrectionDialog } from '../components/CorrectionDialog/CorrectionDialog';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { IngredientFormDialog } from '../components/IngredientFormDialog/IngredientFormDialog';
import { IngredientList } from '../components/IngredientList/IngredientList';
import { InventoryTabs } from '../components/InventoryTabs/InventoryTabs';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { RestockDialog } from '../components/RestockDialog/RestockDialog';
import { useIngredients } from '../hooks/useIngredients';
import { useInventoryCommands } from '../hooks/useInventoryCommands';
import type { IngredientFormSubmitPayload } from '../types/ingredientFormSubmitPayload';
import type { InventoryTab } from '../types/inventoryTab';
import { styles } from './InventoryPage.styles';

type DialogState = { mode: 'create' } | { mode: 'edit'; ingredient: IngredientWithId };

export const InventoryPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const [tab, setTab] = useState<InventoryTab>('active');
  const { status, ingredients } = useIngredients(tab);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IngredientWithId | null>(null);
  const [restockTarget, setRestockTarget] = useState<IngredientWithId | null>(null);
  const [correctTarget, setCorrectTarget] = useState<IngredientWithId | null>(null);
  const commands = useInventoryCommands();

  const submitDialog = async (payload: IngredientFormSubmitPayload) => {
    if (payload.mode === 'create') {
      await createIngredient(payload.input, uid);
    } else if (dialogState?.mode === 'edit') {
      await updateIngredient(dialogState.ingredient.id, payload.input, uid);
    }

    setDialogState(null);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) {
      return;
    }

    await archiveIngredient(archiveTarget.id, uid);
    setArchiveTarget(null);
  };

  const handleRestore = (ingredient: IngredientWithId) => {
    void restoreIngredient(ingredient.id, uid);
  };

  const handleMarkPresent = (ingredient: IngredientWithId) => {
    void commands.markPresent(ingredient.id, uid);
  };

  const handleMarkAbsent = (ingredient: IngredientWithId) => {
    void commands.markAbsent(ingredient.id, uid);
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <LoadingState message={t('inventory.loading')} />;
    }

    if (status === 'error') {
      return <ErrorState message={t('inventory.error')} />;
    }

    if (ingredients.length === 0) {
      return <EmptyState message={t(tab === 'active' ? 'inventory.empty.active' : 'inventory.empty.archived')} />;
    }

    return (
      <IngredientList
        ingredients={ingredients}
        tab={tab}
        onEdit={ingredient => {
          setDialogState({ mode: 'edit', ingredient });
        }}
        onArchive={ingredient => {
          setArchiveTarget(ingredient);
        }}
        onRestore={handleRestore}
        onRestock={ingredient => {
          setRestockTarget(ingredient);
        }}
        onCorrect={ingredient => {
          setCorrectTarget(ingredient);
        }}
        onMarkPresent={handleMarkPresent}
        onMarkAbsent={handleMarkAbsent}
      />
    );
  };

  return (
    <Stack spacing={2} sx={styles.page}>
      <Stack direction="row" sx={styles.header}>
        <Typography variant="h1">{t('nav.inventory')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setDialogState({ mode: 'create' });
          }}
        >
          {t('inventory.actions.create')}
        </Button>
      </Stack>

      <InventoryTabs value={tab} onChange={setTab} />

      {renderContent()}

      {dialogState && (
        <IngredientFormDialog
          open
          mode={dialogState.mode}
          initialValues={
            dialogState.mode === 'edit'
              ? {
                  name: dialogState.ingredient.name,
                  trackingMode: dialogState.ingredient.trackingMode,
                  lowStockThreshold: dialogState.ingredient.lowStockThreshold,
                }
              : { name: '', trackingMode: 'quantity', lowStockThreshold: null }
          }
          onCancel={() => {
            setDialogState(null);
          }}
          onSubmit={submitDialog}
        />
      )}

      <ArchiveConfirmDialog
        open={archiveTarget !== null}
        ingredientName={archiveTarget?.name ?? ''}
        onConfirm={() => void handleArchiveConfirm()}
        onCancel={() => {
          setArchiveTarget(null);
        }}
      />

      {restockTarget && (
        <RestockDialog
          open
          ingredientName={restockTarget.name}
          baseUnit={restockTarget.baseUnit}
          onCancel={() => {
            setRestockTarget(null);
          }}
          onSubmit={async deltaQuantity => {
            await commands.restock(restockTarget.id, deltaQuantity, uid);
            setRestockTarget(null);
          }}
        />
      )}

      {correctTarget && (
        <CorrectionDialog
          open
          ingredientName={correctTarget.name}
          baseUnit={correctTarget.baseUnit}
          onCancel={() => {
            setCorrectTarget(null);
          }}
          onSubmit={async (exactBalance, reason) => {
            await commands.correct(correctTarget.id, exactBalance, reason, uid);
            setCorrectTarget(null);
          }}
        />
      )}
    </Stack>
  );
};
