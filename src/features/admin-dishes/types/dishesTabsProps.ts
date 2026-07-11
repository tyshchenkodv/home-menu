import type { DishesTab } from './dishesTab';

export interface DishesTabsProps {
  value: DishesTab;
  onChange: (tab: DishesTab) => void;
}
