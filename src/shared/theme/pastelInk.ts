import type { Palette, Theme } from '@mui/material/styles';

/**
 * Resolves a text ink from the LIGHT color scheme's palette, with a literal
 * fallback for the bare MUI themes some component tests mount (which omit
 * `colorSchemes`).
 *
 * Pastel `.light` palette tokens stay light in BOTH color schemes — the dark
 * scheme's `.light` values are computed light tints too (see `src/app/theme.ts`)
 * — so any fill built from a `.light` token (or a `theme.palette.*`-frozen
 * surface) reads light in dark mode as well. Text painted on such a fill must
 * therefore be pinned to a FIXED light-scheme ink: the CSS-variable tokens
 * (`text.secondary`, `${color}.dark`) flip to near-white / a too-light `.dark`
 * in dark mode and would render low-contrast — or unreadable — on the pastel.
 *
 * This is the same rationale as `StatusChip`'s original `filledChipInk`; this
 * helper centralizes it so every pastel-fill callout resolves its ink
 * identically. Callers pass a selector so the light palette is read without
 * optional chaining at the call site.
 */
export const lightSchemeInk = (theme: Theme, select: (palette: Palette) => string, fallback: string): string => {
  // The MUI CssThemeVariables augmentation types `colorSchemes.light` as always
  // present, but the bare `createTheme()` themes used by some component tests
  // omit it, so this optional chain is a genuine runtime guard.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const palette = theme.colorSchemes?.light?.palette;
  return palette ? select(palette) : fallback;
};
