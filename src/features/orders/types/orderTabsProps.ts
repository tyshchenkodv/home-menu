export type OrdersTab = 'active' | 'history';

export interface OrderTabsProps {
  value: OrdersTab;
  onChange: (value: OrdersTab) => void;
}
