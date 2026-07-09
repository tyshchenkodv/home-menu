import type { InventoryTab } from './inventoryTab';

export interface InventoryTabsProps {
  value: InventoryTab;
  onChange: (tab: InventoryTab) => void;
}
