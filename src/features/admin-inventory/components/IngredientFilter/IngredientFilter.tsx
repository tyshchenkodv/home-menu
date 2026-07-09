import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import type { IngredientFilterProps } from '../../types/ingredientFilterProps';
import { styles } from './styles';

/** Native select narrowing the history list to one ingredient (active or archived), or all ingredients. */
export const IngredientFilter = ({ ingredients, value, onChange }: IngredientFilterProps) => {
  const { t } = useTranslation();

  return (
    <TextField
      select
      label={t('inventory.history.filter.label')}
      value={value}
      onChange={event => {
        onChange(event.target.value);
      }}
      slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
      sx={styles.select}
    >
      <option value="">{t('inventory.history.filter.all')}</option>
      {ingredients.map(ingredient => (
        <option key={ingredient.id} value={ingredient.id}>
          {ingredient.name}
        </option>
      ))}
    </TextField>
  );
};
