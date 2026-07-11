import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
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
    </Stack>
  );
};
