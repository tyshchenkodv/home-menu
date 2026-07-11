import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import type { OrderTabsProps, OrdersTab } from '../../types/orderTabsProps';

/** Active/History segmented tabs (docs/design/screens/my-orders.md "Layout"). */
export const OrderTabs = ({ value, onChange }: OrderTabsProps) => {
  const { t } = useTranslation();

  return (
    <Tabs
      value={value}
      onChange={(_event, next: OrdersTab) => {
        onChange(next);
      }}
      aria-label={t('orders.title')}
    >
      <Tab value="active" label={t('orders.tabs.active')} />
      <Tab value="history" label={t('orders.tabs.history')} />
    </Tabs>
  );
};
