import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

/** Semantic palette keys a tile can be tinted with. */
export type TileColor = 'primary' | 'warning' | 'error' | 'success';

export const styles: Record<string, SxProps<Theme>> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
    gap: 2,
  },
};

/**
 * Filled card with a soft shadow and a subtle semantic tint washed over the
 * paper background (so "In progress" reads cream, the error tiles read a faint
 * pink, etc.). Left-aligned content, hover lift only when clickable.
 */
export const tileSx =
  (color: TileColor, clickable: boolean): SxProps<Theme> =>
  theme => ({
    padding: 2.5,
    borderRadius: '20px',
    textAlign: 'left',
    display: 'block',
    width: '100%',
    font: 'inherit',
    color: 'inherit',
    cursor: clickable ? 'pointer' : 'default',
    // The paper surface must re-tone per scheme, so it reads from the CSS
    // variable (`theme.vars`); `theme.palette.background.paper` alone is frozen
    // to the light scheme's white and would leave the tile near-white in dark
    // mode, where the inherited/`textSecondary` label flips to near-white and
    // becomes unreadable. The `?? theme` fallback covers bare test themes.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    backgroundColor: (theme.vars ?? theme).palette.background.paper,
    backgroundImage: `linear-gradient(0deg, ${alpha(theme.palette[color].light, 0.5)}, ${alpha(theme.palette[color].light, 0.5)})`,
    border: `1px solid ${alpha(theme.palette[color].main, 0.22)}`,
    boxShadow: '0 6px 18px rgba(58, 46, 52, 0.08)',
    transition: 'box-shadow 120ms ease',
    '&:hover': clickable ? { boxShadow: '0 8px 24px rgba(58, 46, 52, 0.14)' } : undefined,
    // In dark mode the light `.light` wash over the dark paper reads milky, so
    // the tint is rebuilt from the main hue at a low alpha over the (now dark)
    // paper. `alpha()` on the frozen `theme.palette` main stays a concrete
    // rgba, so this never depends on `theme.vars` and is safe in every theme.
    ...theme.applyStyles('dark', {
      backgroundImage: `linear-gradient(0deg, ${alpha(theme.palette[color].main, 0.16)}, ${alpha(theme.palette[color].main, 0.16)})`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`,
      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
    }),
  });

/** Large, bold, semantically-colored tile count. */
export const tileCountSx = (color: TileColor): SxProps<Theme> => ({
  color: `${color}.main`,
  fontWeight: 800,
  fontSize: '2.25rem',
  lineHeight: 1.1,
});
