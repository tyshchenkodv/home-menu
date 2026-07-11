import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { StatusChip } from '../../../../shared/components/StatusChip/StatusChip';
import type { DishCardProps } from '../../types/dishCardProps';
import { getDishAvailabilityStatus } from '../../utils/dishAvailabilityStatus';
import { styles } from './styles';

/** One dish's mobile-first card: availability chip, meta line, meal-type tags, and actions. */
export const DishCard = ({ dish, tab, ingredients, onEdit, onArchive, onRestore }: DishCardProps) => {
  const { t } = useTranslation();
  const status = getDishAvailabilityStatus(dish, ingredients);
  const { availability } = status;

  const missingNames = availability.missingIngredients
    .map(missing => dish.recipeItems.find(item => item.ingredientId === missing.ingredientId)?.ingredientName)
    .filter((name): name is string => Boolean(name));

  const renderMeta = () => {
    if (!availability.configured) {
      return <Typography color="text.secondary">{t('dishes.card.emptyRecipe')}</Typography>;
    }

    if (!availability.canCook && missingNames.length > 0) {
      return (
        <Typography color="text.secondary">
          {t('dishes.card.missing', { ingredients: missingNames.join(', ') })}
        </Typography>
      );
    }

    return (
      <Typography color="text.secondary">
        {t('dishes.card.ingredientCount', { count: dish.recipeItems.length })}
      </Typography>
    );
  };

  const isNotConfigured = !availability.configured;

  return (
    <Card
      variant={isNotConfigured ? 'outlined' : 'elevation'}
      sx={isNotConfigured ? styles.notConfiguredCard : undefined}
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={2} sx={styles.headerRow}>
            <Typography variant="h4" sx={styles.title}>
              {dish.name}
            </Typography>
            <StatusChip label={t(status.labelKey)} color={status.color} />
          </Stack>

          {renderMeta()}

          <Stack direction="row" spacing={1} useFlexGap sx={styles.mealTagRow}>
            {dish.mealTypes.map(mealType => (
              <Chip key={mealType} label={t(`common.meals.${mealType}`)} size="small" sx={styles.mealTag} />
            ))}
          </Stack>

          {tab === 'archived' ? (
            <Button
              variant="outlined"
              onClick={() => {
                onRestore(dish);
              }}
            >
              {t('dishes.actions.restore')}
            </Button>
          ) : isNotConfigured ? (
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => {
                onEdit(dish);
              }}
            >
              {t('dishes.actions.configureRecipe')}
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                sx={styles.actionButton}
                onClick={() => {
                  onEdit(dish);
                }}
              >
                {t('dishes.actions.edit')}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                sx={styles.actionButton}
                onClick={() => {
                  onArchive(dish);
                }}
              >
                {t('dishes.actions.archive')}
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
