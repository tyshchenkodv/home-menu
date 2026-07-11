import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import type { DishesTab } from '../../types/dishesTab';
import type { DishesTabsProps } from '../../types/dishesTabsProps';

/** Active/archived tab switcher for the dishes page. */
export const DishesTabs = ({ value, onChange }: DishesTabsProps) => {
  const { t } = useTranslation();

  return (
    <Tabs
      value={value}
      onChange={(_event, next: DishesTab) => {
        onChange(next);
      }}
      aria-label={t('dishes.tabs.ariaLabel')}
    >
      <Tab value="active" label={t('dishes.tabs.active')} />
      <Tab value="archived" label={t('dishes.tabs.archived')} />
    </Tabs>
  );
};
