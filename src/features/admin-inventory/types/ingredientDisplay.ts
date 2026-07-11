/** Localized unit key used to render a quantity ingredient's amount. */
export type IngredientDisplayUnit = 'gram' | 'kilogram' | 'milliliter' | 'liter' | 'piece';

export interface QuantityDisplay {
  kind: 'quantity';
  amount: number;
  unit: IngredientDisplayUnit;
}

export interface PresenceDisplay {
  kind: 'presence';
  isPresent: boolean;
}

/** Presentation-ready shape derived from an `IngredientWithId` for display. */
export type IngredientDisplay = QuantityDisplay | PresenceDisplay;
