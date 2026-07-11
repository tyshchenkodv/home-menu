import type { SxProps, Theme } from '@mui/material/styles';

import { lightSchemeInk } from '../../../../shared/theme/pastelInk';

/** Counter cell semantic tint per the 05d BatchCard counters matrix
 *  (`docs/design/screens/shared-patterns.md`): available = success,
 *  reserved = primary (secondary when the batch is fully reserved),
 *  consumed/discarded = neutral grey. */
export type CounterTint = 'success' | 'primary' | 'secondary' | 'neutral';

export const styles = {
  container: {
    display: 'flex',
    width: '100%',
    // Clip the tinted cell fills to the rounded outline so their corners
    // don't bleed past the container's border radius.
    overflow: 'hidden',
  },
  row: {
    flex: 1,
  },
} as const;

/** Per-cell layout; only the non-last cell gets a right divider, plus the
 *  cell's semantic tint background driven by theme tokens so the
 *  CSS-variable theme re-tones automatically per color scheme. */
export const cellSx = (isLast: boolean, tint: CounterTint): SxProps<Theme> => ({
  flex: 1,
  padding: 1,
  alignItems: 'center',
  justifyContent: 'center',
  borderRight: isLast ? 'none' : '1px solid',
  borderColor: 'divider',
  ...(tint !== 'neutral' && { backgroundColor: `${tint}.light` }),
});

/** The number's ink follows the cell's tint; neutral cells use the flipping
 *  `text.secondary` (matching the label), while tinted cells pin to the light
 *  scheme's `${tint}.dark` so the number stays readable on the pastel fill in
 *  both schemes. */
export const numberSx = (tint: CounterTint): SxProps<Theme> =>
  tint === 'neutral'
    ? { fontWeight: 600, color: 'text.secondary' }
    : {
        fontWeight: 600,
        color: (theme: Theme) => lightSchemeInk(theme, palette => palette[tint].dark, '#3A2E34'),
      };

/** The label matches the number's cell: neutral cells re-tone with the card via
 *  the flipping `text.secondary`; tinted cells pin to the light scheme's
 *  `text.secondary` so the label stays readable on the pastel fill in dark mode
 *  too, reproducing the light-mode appearance. */
export const labelSx = (tint: CounterTint): SxProps<Theme> => ({
  marginTop: 0.5,
  textAlign: 'center',
  color:
    tint === 'neutral'
      ? 'text.secondary'
      : (theme: Theme) => lightSchemeInk(theme, palette => palette.text.secondary, '#7A6B72'),
});
