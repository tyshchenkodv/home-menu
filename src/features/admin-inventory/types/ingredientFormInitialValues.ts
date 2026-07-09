import type { TrackingMode } from '../../../domain/inventory/types';

export interface IngredientFormInitialValues {
  name: string;
  trackingMode: TrackingMode;
  lowStockThreshold: number | null;
}
