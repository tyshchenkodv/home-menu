import { createTheme } from '@mui/material/styles';

// MUI v9 gates the `colorSchemes`/`cssVariables` theme typings behind this
// module augmentation (see the JSDoc on `CssThemeVariables` in
// `@mui/material/styles/createThemeNoVars.d.ts`); without it `Theme` has no
// `colorSchemes` property even though the feature works at runtime.
declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true;
  }
}

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  // `defaultMode` is a `ThemeProvider` prop, not a `createTheme` option; the
  // equivalent `createTheme` option is `defaultColorScheme`.
  defaultColorScheme: 'light',
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#E36397', light: '#FBD5E5', dark: '#B8446F', contrastText: '#FFFFFF' },
        secondary: { main: '#9B8CDB', light: '#E1DBF7', dark: '#6F5FB3', contrastText: '#FFFFFF' },
        success: { main: '#3FB98C', light: '#CDEFE0', contrastText: '#FFFFFF' }, // Ready now
        warning: { main: '#E0A93B', light: '#FBEEC8', contrastText: '#3A2E34' }, // Can be cooked / expiring
        error: { main: '#E45D5D', light: '#F9D2D2', contrastText: '#FFFFFF' }, // destructive / expired
        info: { main: '#5AA9E6', light: '#D2E9F9', contrastText: '#FFFFFF' },
        background: { default: '#FDF2F6', paper: '#FFFFFF' },
        text: { primary: '#3A2E34', secondary: '#7A6B72', disabled: '#B7A9AF' },
        divider: '#F3DDE5',
        action: { hover: '#FFF1F6', selected: '#FBD5E5' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#F49CBF', light: '#FBD5E5', dark: '#C86D91', contrastText: '#3A1E2A' },
        secondary: { main: '#B7A9EC', contrastText: '#241E33' },
        success: { main: '#6FD0A6' },
        warning: { main: '#EFC46A' },
        error: { main: '#F08A8A' },
        info: { main: '#86C4F0' },
        background: { default: '#1E1A1D', paper: '#2A2329' },
        text: { primary: '#F6E9EF', secondary: '#C6B2BC', disabled: '#7C6C74' },
        divider: 'rgba(255,255,255,0.09)',
      },
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },

  shape: { borderRadius: 14 }, // input 10 · button 14 · card 20 · sheet 24 · chip 999
  spacing: 8, // 0.5/1/1.5/2/3/4 → 4 8 12 16 24 32

  typography: {
    // The `@fontsource-variable` packages register their `@font-face` rules
    // under a "... Variable" family name (see src/app/fonts.ts), so the
    // canon's "Nunito" / "Nunito Sans" names are updated here to match what
    // is actually installed; otherwise these would silently fall back to
    // `system-ui`.
    fontFamily: '"Nunito Sans Variable", system-ui, sans-serif',
    h1: { fontFamily: 'Nunito Variable', fontWeight: 900, fontSize: '2rem', lineHeight: 1.1 },
    h2: { fontFamily: 'Nunito Variable', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.15 },
    h3: { fontFamily: 'Nunito Variable', fontWeight: 800, fontSize: '1.25rem' },
    // Card-title heading (dish/order/batch cards). Not in the transcribed
    // canon scale; sized between h3 (1.25rem) and h5 (1rem) so it reads as a
    // compact card title rather than falling back to MUI's unstyled 2.125rem
    // default, which is what made these titles look oversized and thin.
    h4: { fontFamily: 'Nunito Variable', fontWeight: 800, fontSize: '1.125rem', lineHeight: 1.25 },
    h5: { fontFamily: 'Nunito Variable', fontWeight: 700, fontSize: '1rem' },
    // Dialog titles and the header wordmark. Also not in the transcribed
    // canon scale; sized just above h5 so it still reads as a small heading.
    h6: { fontFamily: 'Nunito Variable', fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.3 },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
    // Small bold section labels. Uses the global Nunito Sans family (not
    // Nunito) so it reads as UI chrome rather than a heading.
    subtitle2: { fontWeight: 700, fontSize: '0.8125rem', lineHeight: 1.3 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
    // Meta text (timestamps, secondary hints).
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button: { fontFamily: 'Nunito Variable', fontWeight: 700, textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.1em' },
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 14, paddingInline: 20 },
        // Light mode gets the canon pink-tinted shadow; dark mode gets a
        // neutral, darker shadow instead of the light-pink literal bleeding
        // through onto a dark background.
        contained: ({ theme: appliedTheme }) => ({
          boxShadow: '0 4px 12px rgba(227,99,151,0.30)',
          ...appliedTheme.applyStyles('dark', { boxShadow: '0 4px 12px rgba(0,0,0,0.45)' }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        // `theme.vars.palette.divider` resolves to the CSS variable, which
        // already differs per scheme (light `#F3DDE5`, dark
        // `rgba(255,255,255,0.09)`), so the border re-tones automatically.
        root: ({ theme: appliedTheme }) => ({
          borderRadius: 20,
          border: `1px solid ${appliedTheme.vars.palette.divider}`,
          boxShadow: '0 2px 12px rgba(184,68,111,0.08)',
          ...appliedTheme.applyStyles('dark', { boxShadow: '0 2px 12px rgba(0,0,0,0.35)' }),
        }),
      },
    },
    // Give outlined inputs an opaque fill so they never read as transparent
    // over the tinted page background. Canon: light-mode fields are white
    // (shared-patterns 05f); dark mode uses a slightly elevated plum tone that
    // stays distinct from both `background.default` and `background.paper`.
    // TextField defaults to the outlined variant and Select renders through
    // OutlinedInput, so this single override covers every field in the app.
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: appliedTheme }) => ({
          backgroundColor: '#FFFFFF',
          ...appliedTheme.applyStyles('dark', { backgroundColor: '#352C33' }),
          '&.Mui-disabled': {
            backgroundColor: appliedTheme.vars.palette.action.disabledBackground,
          },
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 700 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24, boxShadow: '0 16px 44px rgba(58,30,42,0.30)' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiBottomNavigation: {
      styleOverrides: {
        root: ({ theme: appliedTheme }) => ({
          borderTop: `1px solid ${appliedTheme.vars.palette.divider}`,
        }),
      },
    },
  },
});
