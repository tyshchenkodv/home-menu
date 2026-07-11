import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { Theme } from '@mui/material/styles';

import { lightSchemeInk } from '../../theme/pastelInk';

export interface StatusChipProps {
  label: string;
  color: 'success' | 'warning' | 'default' | 'secondary' | 'primary' | 'info' | 'error';
  variant?: 'filled' | 'outlined';
}

/** Resolves the `.light` (fill) and `.main` (dot) tokens for a given status
 *  color. `default` has no semantic palette slot in the theme, so it falls
 *  back to a neutral grey tone per `shared-patterns.md`. */
const paletteTokens = (theme: Theme, color: StatusChipProps['color']) => {
  // `theme.vars` is only populated when the app's `createTheme({ cssVariables: true })`
  // theme is in scope; tests that mount this component under a bare MUI
  // theme (no CSS variables) fall back to `theme.palette` so lookups never
  // throw.
  // The MUI CssThemeVariables augmentation types `theme.vars` as always
  // present, but bare `createTheme()` themes (used by some component tests)
  // leave it undefined at runtime, so the `?? theme` fallback is a real guard
  // despite the type saying otherwise.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const palette = (theme.vars ?? theme).palette;

  if (color === 'default') {
    return { light: palette.action.selected, main: palette.text.disabled };
  }

  return { light: palette[color].light, main: palette[color].main };
};

/**
 * Ink for the filled chip label. The status fill is a light pastel in BOTH
 * schemes (the `.light` tokens stay light-tinted in dark mode too), so the
 * text must be a FIXED dark tone — it cannot follow `text.primary`, which
 * flips to near-white (#F6E9EF) in dark mode and would render light-on-light
 * on the pastel fill. We pin it to the light scheme's `text.primary`
 * (#3A2E34), matching the "light bg, dark text" pastel-chip canon; against
 * every `.light`/pastel fill this dark ink clears WCAG AA in both schemes.
 * The literal fallback covers bare test themes that omit `colorSchemes`.
 */
const filledChipInk = (theme: Theme) => lightSchemeInk(theme, palette => palette.text.primary, '#3A2E34');

/**
 * Small semantic-color pill used to surface an ingredient's stock status, a
 * dish's derived availability (the 4-state matrix in
 * `docs/design/screens/shared-patterns.md`: ready now/success, can-be-cooked/
 * warning, unavailable/default, not-configured/secondary), or an order's
 * 8-status matrix (`docs/design/screens/my-orders.md` "05d"): pending/
 * primary, approved/info, cooking/warning, prepared/success, reserved/
 * secondary, consumed/default, rejected/error, cancelled/default outlined.
 * The color is always paired with a visible text label and an 8px leading
 * dot so the signal never relies on color alone. Filled chips use a light
 * pastel fill (the color's `.light` token) with readable dark text instead
 * of MUI's saturated `.main` fill; the dot itself carries the `.main` tone.
 */
export const StatusChip = ({ label, color, variant = 'filled' }: StatusChipProps) => (
  <Chip
    color={color}
    variant={variant}
    size="small"
    label={label}
    icon={
      <Box
        data-testid="status-chip-dot"
        sx={(theme: Theme) => ({
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: paletteTokens(theme, color).main,
        })}
      />
    }
    sx={
      variant === 'filled'
        ? (theme: Theme) => ({
            bgcolor: paletteTokens(theme, color).light,
            color: filledChipInk(theme),
            '& .MuiChip-icon': { ml: '8px', mr: '-4px' },
          })
        : { '& .MuiChip-icon': { ml: '8px', mr: '-4px' } }
    }
  />
);
