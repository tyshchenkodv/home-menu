import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { MovementListProps } from '../../types/movementListProps';
import { groupMovementsByDay } from '../../utils/groupMovementsByDay';
import { MovementListItem } from './components/MovementListItem/MovementListItem';

/** Mobile-first stack of movement cards for the ready state, grouped by calendar day. */
export const MovementList = ({ movements, baseUnitByIngredientId }: MovementListProps) => {
  const { t, i18n } = useTranslation();
  const dayFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  const groups = groupMovementsByDay(movements);

  return (
    <Stack spacing={2}>
      {groups.map(group => (
        <Stack key={group.date.getTime()} spacing={1.5}>
          <Typography variant="subtitle2" color="text.secondary">
            {group.kind === 'today'
              ? t('inventory.history.day.today')
              : group.kind === 'yesterday'
                ? t('inventory.history.day.yesterday')
                : dayFormatter.format(group.date)}
          </Typography>
          {group.movements.map(movement => (
            <MovementListItem
              key={movement.id}
              movement={movement}
              baseUnit={baseUnitByIngredientId.get(movement.ingredientId) ?? null}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
};
