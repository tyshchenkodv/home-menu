import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import type { InventoryTab } from '../types/inventoryTab';

interface InventoryTabsProps {
  value: InventoryTab;
  onChange: (tab: InventoryTab) => void;
}

/** Active/archived tab switcher for the inventory page. */
export const InventoryTabs = ({ value, onChange }: InventoryTabsProps) => {
  const { t } = useTranslation();

  return (
    <Tabs
      value={value}
      onChange={(_event, next: InventoryTab) => {
        onChange(next);
      }}
      aria-label={t('inventory.tabs.ariaLabel')}
    >
      <Tab value="active" label={t('inventory.tabs.active')} />
      <Tab value="archived" label={t('inventory.tabs.archived')} />
    </Tabs>
  );
};
