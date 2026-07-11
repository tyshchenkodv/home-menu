import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  title: { flex: 1, ml: 1 },
  content: { p: 2, pb: 12, overflowY: 'auto', flex: 1 },
  recipeContainer: { bgcolor: 'action.hover', borderRadius: 2, p: 1.5 },
  recipeRow: { alignItems: 'flex-start' },
  mealTypeRow: { flexWrap: 'wrap' },
  ingredientField: { flex: 2, minWidth: 140 },
  quantityField: { flex: 1, minWidth: 90 },
  unitField: { minWidth: 96 },
  addIngredientButton: { alignSelf: 'flex-start' },
  footer: {
    p: 2,
    borderTop: '1px solid',
    borderColor: 'divider',
    position: 'sticky',
    bottom: 0,
    bgcolor: 'background.paper',
  },
  footerButton: { flex: 1 },
  footerSubmitButton: { flex: 2 },
};
