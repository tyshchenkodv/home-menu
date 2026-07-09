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
    h5: { fontFamily: 'Nunito Variable', fontWeight: 700, fontSize: '1rem' },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
    button: { fontFamily: 'Nunito Variable', fontWeight: 700, textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.1em' },
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 14, paddingInline: 20 },
        contained: { boxShadow: '0 4px 12px rgba(227,99,151,0.30)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 20, border: '1px solid #F3DDE5', boxShadow: '0 2px 12px rgba(184,68,111,0.08)' },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 700 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24, boxShadow: '0 16px 44px rgba(58,30,42,0.30)' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiBottomNavigation: { styleOverrides: { root: { borderTop: '1px solid #F3DDE5' } } },
  },
});
