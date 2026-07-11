import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { buildScheduledForMillis } from '../../../domain/orders/scheduledFor';
import type { CalendarDate, MealType } from '../../../domain/orders/types';
import { getGeneralSettings } from '../../../infrastructure/firebase/services/settingsService';
import type { DefaultMealTimes } from '../../../shared/types/generalSettings';
import { CookingRequestDialog } from '../components/CookingRequestDialog/CookingRequestDialog';
import { DateMealSelector } from '../components/DateMealSelector/DateMealSelector';
import { DishAvailabilityCard } from '../components/DishAvailabilityCard/DishAvailabilityCard';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ErrorState } from '../components/ErrorState/ErrorState';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { ReserveDialog } from '../components/ReserveDialog/ReserveDialog';
import { useDishAvailability } from '../hooks/useDishAvailability';
import { useMenuCommands } from '../hooks/useMenuCommands';
import { useMenuDishes } from '../hooks/useMenuDishes';
import type { MenuDishView } from '../types/menuDishView';
import { buildDateOptions, calendarDateKey, toCalendarDate } from '../utils/buildDateOptions';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];
const KYIV_TIME_ZONE = 'Europe/Kyiv';

type DialogState = { kind: 'reserve'; view: MenuDishView } | { kind: 'request'; view: MenuDishView } | null;

/**
 * Snapshot of "now", read once per mount (or retry) inside an effect rather
 * than during render — `Date.now()` is impure, so it must not be called
 * directly in the render body (React's purity rule for components/hooks).
 */
interface ClockSnapshot {
  today: CalendarDate;
  nowMillis: number;
}

export const MenuPage = () => {
  const { t } = useTranslation();

  const [mealTimes, setMealTimes] = useState<DefaultMealTimes | null>(null);
  // Lazy initializer: read once on mount, not on every render (React's
  // purity rule forbids calling the impure `Date.now()` directly in the
  // render body).
  const [clock] = useState<ClockSnapshot>(() => {
    const nowMillis = Date.now();
    return { today: toCalendarDate(nowMillis, KYIV_TIME_ZONE), nowMillis };
  });
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    void getGeneralSettings().then(settings => {
      setMealTimes(settings.defaultMealTimes);
    });
  }, [retryToken]);

  const dishesResult = useMenuDishes(mealType);
  const availabilityResult = useDishAvailability(dishesResult.dishes);
  const commands = useMenuCommands();

  const dateOptions = useMemo(() => buildDateOptions(clock.today), [clock]);
  const selectedDate = dateOptions.find(option => option.key === selectedDateKey)?.date ?? dateOptions[0].date;

  const pastMeals = useMemo(() => {
    if (!mealTimes) {
      return [];
    }
    if (calendarDateKey(selectedDate) !== calendarDateKey(clock.today)) {
      return [];
    }
    return MEAL_ORDER.filter(
      candidate => buildScheduledForMillis(selectedDate, mealTimes[candidate]) <= clock.nowMillis,
    );
  }, [mealTimes, selectedDate, clock]);

  const scheduledForMillis = mealTimes ? buildScheduledForMillis(selectedDate, mealTimes[mealType]) : null;

  const status =
    dishesResult.status === 'error' || availabilityResult.status === 'error'
      ? 'error'
      : dishesResult.status === 'loading' || availabilityResult.status === 'loading' || mealTimes === null
        ? 'loading'
        : 'ready';

  const renderContent = () => {
    if (status === 'loading') {
      return <LoadingState message={t('menu.loading')} />;
    }

    if (status === 'error') {
      return (
        <ErrorState
          message={t('menu.error.body')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setRetryToken(current => current + 1);
          }}
        />
      );
    }

    if (availabilityResult.views.length === 0) {
      return (
        <EmptyState
          message={t('menu.empty.body')}
          actionLabel={t('menu.empty.action')}
          onAction={() => {
            setSelectedDateKey(dateOptions[1].key);
          }}
        />
      );
    }

    return (
      <Stack spacing={1.5}>
        {availabilityResult.views.map(view => (
          <DishAvailabilityCard
            key={view.dish.id}
            view={view}
            onReserve={selected => {
              setDialogState({ kind: 'reserve', view: selected });
            }}
            onRequestCooking={selected => {
              setDialogState({ kind: 'request', view: selected });
            }}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h1">{t('menu.title')}</Typography>

      <DateMealSelector
        options={dateOptions}
        selectedDateKey={calendarDateKey(selectedDate)}
        onSelectDate={setSelectedDateKey}
        mealType={mealType}
        onSelectMeal={setMealType}
        pastMeals={pastMeals}
      />

      {renderContent()}

      {dialogState?.kind === 'reserve' && scheduledForMillis !== null && (
        <ReserveDialog
          open
          dishName={dialogState.view.dish.name}
          availableQuantity={dialogState.view.availability.readyQuantity}
          onCancel={() => {
            setDialogState(null);
          }}
          onConfirm={async quantity => {
            await commands.reserve({
              dishId: dialogState.view.dish.id,
              quantity,
              mealType,
              scheduledForMillis,
            });
            setDialogState(null);
          }}
        />
      )}

      {dialogState?.kind === 'request' && scheduledForMillis !== null && (
        <CookingRequestDialog
          open
          dishName={dialogState.view.dish.name}
          date={selectedDate}
          mealType={mealType}
          onCancel={() => {
            setDialogState(null);
          }}
          onConfirm={async quantity => {
            await commands.requestCooking({
              dishId: dialogState.view.dish.id,
              dishName: dialogState.view.dish.name,
              quantity,
              mealType,
              scheduledForMillis,
            });
            setDialogState(null);
          }}
        />
      )}
    </Stack>
  );
};
