import type { SxProps, Theme } from '@mui/material/styles';

export const styles: Record<string, SxProps<Theme>> = {
  // The gradient must read from `theme.vars` (the per-scheme CSS variables),
  // not `theme.palette.*`. Under `cssVariables` mode `theme.palette.*` is
  // frozen to the default (light) scheme's literal values, so a `theme.palette`
  // gradient stayed light-pink in dark mode while the CSS-variable text tones
  // flipped to their dark values — producing light text on a light background.
  // `theme.vars ?? theme` keeps the lookup safe under bare test themes that
  // have no CSS variables. Dark mode gets its own neutral plum gradient built
  // from the dark surface tokens via `applyStyles`.
  page: (theme: Theme) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const palette = (theme.vars ?? theme).palette;

    return {
      minHeight: '100dvh',
      alignItems: 'center',
      justifyContent: 'center',
      px: 3,
      py: 8,
      position: 'relative',
      background: `linear-gradient(180deg, ${palette.primary.light} 0%, ${palette.background.default} 45%, ${palette.secondary.light} 100%)`,
      ...theme.applyStyles('dark', {
        background: `linear-gradient(180deg, ${palette.background.paper} 0%, ${palette.background.default} 55%, ${palette.background.paper} 100%)`,
      }),
    };
  },
  languageSwitcher: { position: 'absolute', top: 24, right: 24 },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    textAlign: 'center',
  },
  mascot: { color: 'primary.main' },
  brandRow: { alignItems: 'center', justifyContent: 'center' },
  mark: { display: 'flex', color: 'primary.main' },
  wordmark: { fontWeight: 900, color: 'primary.dark' },
  tagline: { color: 'text.secondary' },
  form: { width: '100%', alignItems: 'center' },
  passwordToggle: { minWidth: 44, minHeight: 44 },
  hint: { color: 'text.secondary' },
};
