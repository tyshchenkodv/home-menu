import CloseIcon from '@mui/icons-material/Close';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DishDomainError } from '../../../../domain/dishes/errors';
import type { MealType, RecipeItem } from '../../../../domain/dishes/types';
import { convertToBaseUnit } from '../../../../domain/inventory/convertToBaseUnit';
import type { InputUnit } from '../../../../domain/inventory/types';
import type { IngredientWithId } from '../../../../shared/types/ingredient';
import { resolveErrorTranslationKey } from '../../errorMessages';
import type { DishFormDialogProps } from '../../types/dishFormDialogProps';
import type { DishFormSubmitPayload } from '../../types/dishFormSubmitPayload';
import { createEmptyRecipeRow, type RecipeRowValue } from '../../types/recipeRowValue';
import { allowedInputUnitsForBaseUnit } from '../../utils/allowedInputUnits';
import { styles } from './styles';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

const UNIT_LABEL_KEY: Record<InputUnit, string> = {
  g: 'common.units.gram',
  kg: 'common.units.kilogram',
  ml: 'common.units.milliliter',
  l: 'common.units.liter',
  pieces: 'common.units.piece',
};

let rowKeySequence = 0;
const nextRowKey = () => {
  rowKeySequence += 1;
  return `row-${String(rowKeySequence)}`;
};

function buildRecipeItem(row: RecipeRowValue, ingredient: IngredientWithId | undefined): RecipeItem {
  if (!ingredient) {
    return { ingredientId: row.ingredientId, ingredientName: '', requiredQuantity: null, requiresPresence: null };
  }

  if (ingredient.baseUnit === 'presence') {
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      requiredQuantity: null,
      requiresPresence: true,
    };
  }

  const amount = Number(row.quantityText.trim());
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      requiredQuantity: null,
      requiresPresence: null,
    };
  }

  const converted = convertToBaseUnit(amount, row.inputUnit);
  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    requiredQuantity: converted.quantity,
    requiresPresence: null,
  };
}

/**
 * Mirrors the `validateDish` "recipe row" rule (`src/domain/dishes/validateDish.ts`):
 * a present row must reference an ingredient and specify either a positive
 * required quantity or `requiresPresence === true`. Returns a boolean rather
 * than throwing so it can drive both the submit-time error set and the
 * reactive disabled condition without duplicating the domain's error copy.
 */
function isRecipeItemIncomplete(item: RecipeItem): boolean {
  const hasPositiveQuantity =
    typeof item.requiredQuantity === 'number' && Number.isFinite(item.requiredQuantity) && item.requiredQuantity > 0;
  return item.ingredientId.trim().length === 0 || (!hasPositiveQuantity && item.requiresPresence !== true);
}

/**
 * Create-and-edit dish full-screen dialog per `docs/design/screens/admin-dishes.md`.
 * Fields are the single `name`/`description` strings from
 * `docs/03-data-model.md` (no bilingual uk/en pair — see the dishes slice
 * decision note), a meal-type multi-select, and a recipe-row editor. The
 * recipe may be saved empty (a dish with no recipe is valid but "not
 * configured"); every row that has been added must be complete.
 */
export const DishFormDialog = ({
  open,
  mode,
  initialValues,
  availableIngredients,
  onCancel,
  onSubmit,
  onRequestArchive,
}: DishFormDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [mealTypes, setMealTypes] = useState<MealType[]>(initialValues.mealTypes);
  const [rows, setRows] = useState<RecipeRowValue[]>(initialValues.recipeRows);
  const [formErrorKey, setFormErrorKey] = useState<string | null>(null);
  const [invalidRowKeys, setInvalidRowKeys] = useState<Set<string>>(() => new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ingredientsById = new Map(availableIngredients.map(ingredient => [ingredient.id, ingredient]));

  const hasIncompleteRow = rows.some(row =>
    isRecipeItemIncomplete(buildRecipeItem(row, ingredientsById.get(row.ingredientId))),
  );
  const isFormInvalid = name.trim().length === 0 || mealTypes.length === 0 || hasIncompleteRow;

  const toggleMealType = (mealType: MealType) => {
    setMealTypes(current =>
      current.includes(mealType) ? current.filter(value => value !== mealType) : [...current, mealType],
    );
  };

  const addRow = () => {
    setRows(current => [...current, createEmptyRecipeRow(nextRowKey())]);
  };

  const removeRow = (key: string) => {
    setRows(current => current.filter(row => row.key !== key));
  };

  const updateRow = (key: string, patch: Partial<RecipeRowValue>) => {
    setRows(current => current.map(row => (row.key === key ? { ...row, ...patch } : row)));
  };

  const buildPayload = (): DishFormSubmitPayload => {
    const trimmedName = name.trim();
    const recipeItems = rows.map(row => buildRecipeItem(row, ingredientsById.get(row.ingredientId)));

    const incompleteKeys = new Set(
      rows.filter((_row, index) => isRecipeItemIncomplete(recipeItems[index])).map(row => row.key),
    );
    setInvalidRowKeys(incompleteKeys);

    if (incompleteKeys.size > 0) {
      throw new DishDomainError('dish/incomplete-recipe-item');
    }

    if (trimmedName.length === 0) {
      throw new DishDomainError('dish/invalid-name');
    }

    if (mealTypes.length === 0) {
      throw new DishDomainError('dish/meal-type-required');
    }

    const input = { name: trimmedName, description: description.trim(), mealTypes, recipeItems };

    return mode === 'create' ? { mode: 'create', input } : { mode: 'edit', input };
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setFormErrorKey(null);

    let payload: DishFormSubmitPayload;
    try {
      payload = buildPayload();
    } catch (error) {
      setFormErrorKey(resolveErrorTranslationKey(error));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setFormErrorKey(resolveErrorTranslationKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} fullScreen aria-labelledby="dish-form-title">
      <AppBar position="relative" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" aria-label={t('dishes.form.close')} onClick={onCancel}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" id="dish-form-title" sx={styles.title}>
            {t(mode === 'create' ? 'dishes.form.createTitle' : 'dishes.form.editTitle')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={styles.content}>
        <Stack spacing={3}>
          <TextField
            label={t('dishes.form.nameLabel')}
            placeholder={t('dishes.form.namePlaceholder')}
            value={name}
            onChange={event => {
              setName(event.target.value);
            }}
            fullWidth
          />

          <TextField
            label={t('dishes.form.descriptionLabel')}
            value={description}
            onChange={event => {
              setDescription(event.target.value);
            }}
            multiline
            minRows={2}
            fullWidth
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">{t('dishes.form.recipeTitle')}</Typography>
            <Stack spacing={1.5} sx={styles.recipeContainer}>
              {rows.map(row => {
                const ingredient = ingredientsById.get(row.ingredientId);
                const isPresenceIngredient = ingredient?.baseUnit === 'presence';
                const isRowInvalid = invalidRowKeys.has(row.key);

                return (
                  <Stack direction="row" spacing={1} sx={styles.recipeRow} key={row.key}>
                    <TextField
                      select
                      label={t('dishes.form.ingredientPlaceholder')}
                      value={row.ingredientId}
                      onChange={event => {
                        updateRow(row.key, { ingredientId: event.target.value });
                      }}
                      error={isRowInvalid}
                      sx={styles.ingredientField}
                    >
                      {availableIngredients.map(candidate => (
                        <MenuItem key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    {!isPresenceIngredient && (
                      <TextField
                        label={t('dishes.form.quantityLabel')}
                        value={row.quantityText}
                        onChange={event => {
                          updateRow(row.key, { quantityText: event.target.value });
                        }}
                        error={isRowInvalid}
                        sx={styles.quantityField}
                      />
                    )}

                    {!isPresenceIngredient && (
                      <TextField
                        select
                        label={t('dishes.form.unitLabel')}
                        value={row.inputUnit}
                        onChange={event => {
                          updateRow(row.key, { inputUnit: event.target.value as InputUnit });
                        }}
                        sx={styles.unitField}
                      >
                        {(ingredient
                          ? allowedInputUnitsForBaseUnit(ingredient.baseUnit)
                          : (['g', 'kg', 'ml', 'l', 'pieces'] as InputUnit[])
                        ).map(unit => (
                          <MenuItem key={unit} value={unit}>
                            {t(UNIT_LABEL_KEY[unit])}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    <IconButton
                      aria-label={t('dishes.form.removeIngredient')}
                      color={isRowInvalid ? 'error' : 'default'}
                      onClick={() => {
                        removeRow(row.key);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}
              <Button onClick={addRow} sx={styles.addIngredientButton}>
                {t('dishes.form.addIngredient')}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {t('dishes.form.unitsHelp')}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">{t('dishes.form.mealTypesLabel')}</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={styles.mealTypeRow}>
              {MEAL_TYPES.map(mealType => {
                const selected = mealTypes.includes(mealType);
                return (
                  <Chip
                    key={mealType}
                    label={selected ? `✓ ${t(`common.meals.${mealType}`)}` : t(`common.meals.${mealType}`)}
                    color={selected ? 'primary' : 'default'}
                    onClick={() => {
                      toggleMealType(mealType);
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>

          {formErrorKey && <Typography color="error">{t(formErrorKey)}</Typography>}
        </Stack>
      </Box>

      <Box sx={styles.footer}>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting} sx={styles.footerButton}>
            {t('common.cancel')}
          </Button>
          {mode === 'edit' && onRequestArchive && (
            <Button
              variant="outlined"
              color="warning"
              onClick={onRequestArchive}
              disabled={isSubmitting}
              sx={styles.footerButton}
            >
              {t('dishes.actions.archive')}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || isFormInvalid}
            sx={styles.footerSubmitButton}
          >
            {isSubmitting ? t('common.saving') : t('dishes.form.save')}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};
