import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DefaultMealTimes } from '../../../../shared/types/generalSettings';
import { styles } from './MealTimesForm.styles';

export interface MealTimesFormProps {
  initialTimes: DefaultMealTimes;
  hasNeverBeenSaved: boolean;
  isSaving: boolean;
  error: Error | null;
  onSave: (times: DefaultMealTimes) => Promise<void>;
}

export const MealTimesForm = ({ initialTimes, hasNeverBeenSaved, isSaving, error, onSave }: MealTimesFormProps) => {
  const { t } = useTranslation();
  const [breakfast, setBreakfast] = useState(initialTimes.breakfast);
  const [lunch, setLunch] = useState(initialTimes.lunch);
  const [dinner, setDinner] = useState(initialTimes.dinner);
  const [localError, setLocalError] = useState<string | null>(null);

  const hasChanges =
    breakfast !== initialTimes.breakfast || lunch !== initialTimes.lunch || dinner !== initialTimes.dinner;

  const handleReset = () => {
    setBreakfast(initialTimes.breakfast);
    setLunch(initialTimes.lunch);
    setDinner(initialTimes.dinner);
    setLocalError(null);
  };

  const handleSave = async () => {
    setLocalError(null);
    try {
      await onSave({
        breakfast,
        lunch,
        dinner,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Stack spacing={2}>
      {hasNeverBeenSaved && (
        <Alert severity="info" sx={styles.banner}>
          {t('settings.mealTimes.defaultBanner')}
        </Alert>
      )}

      {error || localError ? (
        <Alert severity="error">
          <Typography variant="subtitle2">{t('settings.error.title')}</Typography>
          <Typography>{t('settings.error.body')}</Typography>
        </Alert>
      ) : null}

      <Paper sx={styles.card}>
        {/* Breakfast row */}
        <Stack sx={styles.row}>
          <Chip label={t('common.meals.breakfast')} sx={styles.mealChipBreakfast} />
          <TextField
            type="time"
            value={breakfast}
            onChange={e => {
              setBreakfast(e.target.value);
            }}
            aria-label={t('common.meals.breakfast')}
            sx={styles.timeInput}
            disabled={isSaving}
          />
        </Stack>

        {/* Lunch row */}
        <Stack sx={styles.row}>
          <Chip label={t('common.meals.lunch')} sx={styles.mealChipLunch} />
          <TextField
            type="time"
            value={lunch}
            onChange={e => {
              setLunch(e.target.value);
            }}
            aria-label={t('common.meals.lunch')}
            sx={styles.timeInput}
            disabled={isSaving}
          />
        </Stack>

        {/* Dinner row */}
        <Stack sx={styles.row}>
          <Chip label={t('common.meals.dinner')} sx={styles.mealChipDinner} />
          <TextField
            type="time"
            value={dinner}
            onChange={e => {
              setDinner(e.target.value);
            }}
            aria-label={t('common.meals.dinner')}
            sx={styles.timeInput}
            disabled={isSaving}
          />
        </Stack>

        <Typography sx={styles.helper}>{t('settings.mealTimes.defaultsHelp')}</Typography>

        <Stack sx={styles.buttonRow}>
          {hasNeverBeenSaved && (
            <Button onClick={handleReset} variant="outlined" disabled={isSaving}>
              {t('settings.mealTimes.reset')}
            </Button>
          )}
          <Button
            onClick={() => void handleSave()}
            variant="contained"
            disabled={isSaving || (!hasChanges && !hasNeverBeenSaved)}
          >
            {isSaving ? (
              <>
                <CircularProgress size={20} sx={styles.savingSpinner} />
                {t('settings.saving')}
              </>
            ) : (
              t('settings.save')
            )}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};
