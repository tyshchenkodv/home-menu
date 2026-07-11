import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { MealType } from '../../../../domain/orders/types';
import type { DateMealSelectorProps } from '../../types/dateMealSelectorProps';
import { formatCalendarDateLabel } from '../../utils/formatCalendarDate';
import { styles } from './styles';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Date pill row (today..+7, SPEC "Domain and data model" rule 2) plus meal
 * tabs (`docs/design/screens/menu-browse.md`). A meal whose `scheduledFor`
 * has already passed today is shown but disabled (the "Passed" edge case).
 */
export const DateMealSelector = ({
  options,
  selectedDateKey,
  onSelectDate,
  mealType,
  onSelectMeal,
  pastMeals,
}: DateMealSelectorProps) => {
  const { t, i18n } = useTranslation();

  const isSelectedMealPast = pastMeals.includes(mealType);
  const nextMeal = MEAL_TYPES.find(candidate => !pastMeals.includes(candidate));

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={styles.dateRow}>
        {options.map(option => (
          <Chip
            key={option.key}
            label={formatCalendarDateLabel(option.date, i18n.language)}
            color={option.key === selectedDateKey ? 'primary' : 'default'}
            onClick={() => {
              onSelectDate(option.key);
            }}
            sx={styles.dateChip}
          />
        ))}
      </Stack>

      <Tabs
        value={mealType}
        onChange={(_event, value: MealType) => {
          onSelectMeal(value);
        }}
        aria-label={t('menu.title')}
      >
        {MEAL_TYPES.map(candidate => (
          <Tab
            key={candidate}
            value={candidate}
            label={
              pastMeals.includes(candidate)
                ? `${t(`common.meals.${candidate}`)} · ${t('menu.past.label')}`
                : t(`common.meals.${candidate}`)
            }
            disabled={pastMeals.includes(candidate)}
          />
        ))}
      </Tabs>

      {isSelectedMealPast && nextMeal && (
        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary">
            {t('menu.past.explanation', { nextMeal: t(`common.meals.${nextMeal}`) })}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              onSelectMeal(nextMeal);
            }}
          >
            {t('menu.past.nextMealCta', { nextMeal: t(`common.meals.${nextMeal}`) })}
          </Button>
        </Stack>
      )}
    </Stack>
  );
};
