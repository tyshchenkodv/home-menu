import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import type { MovementTypeFilterProps } from '../../types/movementTypeFilterProps';
import type { MovementTypeFilterValue } from '../../types/movementTypeFilterValue';
import { styles } from './styles';

const FILTER_VALUES: MovementTypeFilterValue[] = ['all', 'restock', 'correction', 'cooking', 'archive_adjustment'];

/** Pill chip row narrowing the movement history to one movement type, or all. */
export const MovementTypeFilter = ({ value, onChange }: MovementTypeFilterProps) => {
  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={1} sx={styles.row}>
      {FILTER_VALUES.map(filterValue => (
        <Chip
          key={filterValue}
          label={t(`inventory.history.type.${filterValue}`)}
          color={value === filterValue ? 'primary' : 'default'}
          variant={value === filterValue ? 'filled' : 'outlined'}
          onClick={() => {
            onChange(filterValue);
          }}
        />
      ))}
    </Stack>
  );
};
