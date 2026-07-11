# Design system reference

This document is the **machine-readable canon** for Home Menu's visual design.
It is transcribed from the designer's mockup bundle at
`design/Home Menu (standalone).html`.

## How to use this

- **`docs/design/README.md` (this file) and `src/app/theme.ts` are the canon.**
  Build and review UI against the tokens and rules recorded here.
- **`design/Home Menu (standalone).html` is a human visual reference only.** It is a
  self-contained Claude artifact bundle (React + Babel packed into a base64
  manifest). Open it in a browser to feel the tone, rhythm, and screen layouts.
  Do not try to read or scrape it programmatically, and do not treat it as
  pixel-accurate.
- When the mockup and this document disagree, this document wins. When this
  document is silent, follow `frontend-architecture` and the mockup's tone.

The mockup organizes itself into: `01 Color`, `02 Type & tokens`, `03 Cat art`,
`04 Components`, `05 Screens`, `06 Dark theme`, `06b Responsive`, and
`07 MUI theme mapping`. The sections below capture the durable parts of each.

## Status of adoption

The **design system foundation** slice is implemented (see
`docs/specifications/design-system-foundation/`). Wired into the app:

- `src/app/theme.ts` carries the full `light` + `dark` color schemes,
  typography, spacing, radii, and component overrides below, via MUI CSS
  variables (`colorSchemeSelector: 'data'`, `defaultColorScheme: 'light'`).
- Nunito / Nunito Sans are self-hosted (`@fontsource-variable/*`, Cyrillic
  included); no external font requests.
- A persistent `AppHeader` (`src/shared/components/AppHeader/`) renders the
  brand mascot, the `app.title` wordmark, a `LanguageSwitcher` (UK/EN), and a
  binary light↔dark `ColorSchemeToggle` (default light, persisted).
- `CatArt` (`src/shared/components/CatArt/`) provides the faithful multi-color
  illustrations (originally transcribed from the design mockup, now maintained
  directly in that component),
  with variants `idle`, `empty`, `sleeping`, `confused`, and `logo`. The header
  uses `logo`; loading/empty/error states use `sleeping`/`empty`/`confused` via
  the shared `StatePlaceholder`.
- The `admin-inventory` screens are retrofitted to the design (see
  `admin-inventory-design-retrofit`): `IngredientCard` shows a `StatusChip`
  (`src/shared/components/StatusChip/`) and a kebab action menu, the inventory
  screen adds via a FAB, and the history screen groups movements by day with
  a movement-type filter chip row (All/Restock/Correction/Cooking/Archive
  adjustment) and signed, color-coded deltas.
- The `LoginPage` (`src/features/auth/`) carries the brand mascot (`CatArt`
  `idle`), the `app.title` wordmark, a tagline, and a "Sign in with Google"
  button — see `screens/login.md` for the full, as-built spec (Google
  Sign-In only; no email/password form).
- The responsive navigation shell is implemented (see
  `docs/specifications/navigation-shell/`): `AppShell`
  (`src/shared/components/AppShell/`) is a layout route rendering `AppHeader`
  plus role-aware navigation and the routed `Outlet`. Below the `md`
  breakpoint it renders a `BottomNavigation` (admin: four primary
  destinations; user: three destinations directly); at `md` and above it
  promotes to a persistent `Drawer` listing every destination. The active
  destination is emphasized with `primary` and exposed to assistive tech.
- The **MVP completion** slice is implemented (`docs/specifications/mvp-completion/`):
  all feature screens are now functional including Menu (`/menu`), Orders
  (`/orders`, user + admin flavors), Dashboard (`/admin`), Batches
  (`/admin/batches`), Dishes (`/admin/dishes`), and Settings (`/settings`).
  Cooking requests are integrated into the Orders flow (no separate route).
  Settings includes the real meal-times form with persistence and defaults.
  All screens have proper loading, error, empty, and ready states per
  `docs/design/screens/` specifications.

## Authoritative MUI theme (source of truth)

Transcribed verbatim from the mockup's `07 MUI theme mapping` handoff. This is
the target shape of `src/app/theme.ts`.

```ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: { palette: {
      primary:   { main: '#E36397', light: '#FBD5E5', dark: '#B8446F', contrastText: '#FFFFFF' },
      secondary: { main: '#9B8CDB', light: '#E1DBF7', dark: '#6F5FB3', contrastText: '#FFFFFF' },
      success:   { main: '#3FB98C', light: '#CDEFE0', contrastText: '#FFFFFF' }, // Ready now
      warning:   { main: '#E0A93B', light: '#FBEEC8', contrastText: '#3A2E34' }, // Can be cooked / expiring
      error:     { main: '#E45D5D', light: '#F9D2D2', contrastText: '#FFFFFF' }, // destructive / expired
      info:      { main: '#5AA9E6', light: '#D2E9F9', contrastText: '#FFFFFF' },
      background:{ default: '#FDF2F6', paper: '#FFFFFF' },
      text:      { primary: '#3A2E34', secondary: '#7A6B72', disabled: '#B7A9AF' },
      divider:   '#F3DDE5',
      action:    { hover: '#FFF1F6', selected: '#FBD5E5' },
    }},
    dark: { palette: {
      primary:   { main: '#F49CBF', light: '#FBD5E5', dark: '#C86D91', contrastText: '#3A1E2A' },
      secondary: { main: '#B7A9EC', contrastText: '#241E33' },
      success:   { main: '#6FD0A6' }, warning: { main: '#EFC46A' },
      error:     { main: '#F08A8A' }, info: { main: '#86C4F0' },
      background:{ default: '#1E1A1D', paper: '#2A2329' },
      text:      { primary: '#F6E9EF', secondary: '#C6B2BC', disabled: '#7C6C74' },
      divider:   'rgba(255,255,255,0.09)',
    }},
  },

  shape: { borderRadius: 14 },         // input 10 · button 14 · card 20 · sheet 24 · chip 999
  spacing: 8,                          // 0.5/1/1.5/2/3/4 -> 4 8 12 16 24 32

  typography: {
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
    h1: { fontFamily: 'Nunito', fontWeight: 900, fontSize: '2rem',    lineHeight: 1.1 },
    h2: { fontFamily: 'Nunito', fontWeight: 800, fontSize: '1.5rem',  lineHeight: 1.15 },
    h3: { fontFamily: 'Nunito', fontWeight: 800, fontSize: '1.25rem' },
    h5: { fontFamily: 'Nunito', fontWeight: 700, fontSize: '1rem' },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
    button: { fontFamily: 'Nunito', fontWeight: 700, textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.1em' },
  },

  components: {
    MuiButton: { defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 14, paddingInline: 20 },
        contained: { boxShadow: '0 4px 12px rgba(227,99,151,0.30)' } } },
    MuiCard:   { styleOverrides: { root: { borderRadius: 20,
        border: '1px solid #F3DDE5', boxShadow: '0 2px 12px rgba(184,68,111,0.08)' } } },
    MuiChip:   { styleOverrides: { root: { borderRadius: 999, fontWeight: 700 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24,
        boxShadow: '0 16px 44px rgba(58,30,42,0.30)' } } },
    MuiPaper:  { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiBottomNavigation: { styleOverrides: { root: { borderTop: '1px solid #F3DDE5' } } },
  },
});
```

## Semantic color usage

The palette is pastel-forward, led by rose. Every value maps to a MUI palette
slot, so components should reference `theme.palette.*` (or the CSS variables MUI
generates), never raw hex.

| Role | Meaning in the product |
| --- | --- |
| `primary` | Brand rose. Primary actions, headers, active nav. |
| `secondary` | Lavender. Secondary emphasis, "not configured" status. |
| `success` | "Ready now" — a dish can be served from prepared batches. |
| `warning` | "Can be cooked" / expiring soon. |
| `error` | Destructive actions, expired, not-found states. |
| `info` | Neutral informational accents. |

### Status chip mapping

Domain statuses map to MUI chip colors (build as a `Chip` with a leading dot via
an icon):

| Status | Chip color |
| --- | --- |
| Ready now | `success` |
| Can be cooked | `warning` |
| Unavailable | `default` (grey) |
| Not configured | `secondary` |

## Typography

- Display/headings: **Nunito** (weights 700–900).
- Body/UI: **Nunito Sans**, falling back to `system-ui, sans-serif`.
- Buttons use Nunito 700 with `textTransform: 'none'`.
- Font sourcing is an open decision (see below) — the mockup embeds the font,
  but self-hosting vs. any external source must respect the repo's
  public/privacy rules.

## Shape & spacing

- Base spacing unit: **8px**. Scale used: 0.5/1/1.5/2/3/4 → 4/8/12/16/24/32.
- Radii by surface: input **10**, button **14**, card **20**, sheet **24**,
  chip **999** (pill). Global `shape.borderRadius` is **14**.

## Illustration — `CatArt`

The design defines a flat-pastel cat mascot ("Kotyk") as a reusable SVG
component, addressed as `<CatArt variant size />`. The authoritative SVG source
now lives in the component itself (`src/shared/components/CatArt/`). Variants: `idle` (happy —
headers/success), `empty` (empty states), `sleeping` (loading/skeleton),
`confused` (error / not-found), and `logo` (the compact brand mark used in the
`AppHeader`). Implemented at `src/shared/components/CatArt/`.

## Screen catalog (`05 Screens`)

The mockup's screen layouts are transcribed into machine-readable per-screen
specifications under `docs/design/screens/` — **those files are the canon for
screen structure, states, dialogs, and validation**; the mockup remains the
visual reference. `docs/design/screen-spec-checklist.md` defines the required
coverage and the transcription template.

| Screen | Transcription |
| --- | --- |
| Login / onboarding | `screens/login.md` |
| Menu browse + reservation flow | `screens/menu-browse.md` |
| My orders (user) | `screens/my-orders.md` |
| Cooking request creation | `screens/cooking-request.md` |
| Admin dashboard | `screens/admin-dashboard.md` |
| Admin orders | `screens/admin-orders.md` |
| Prepared batches | `screens/admin-batches.md` |
| Dishes management | `screens/admin-dishes.md` |
| Ingredient inventory (implemented) | `screens/admin-inventory.md` |
| Settings | `screens/settings.md` |
| Cross-screen canon (status matrix, dialogs, states, responsive, dark) | `screens/shared-patterns.md` |

Responsive (`06b`): the same screens promote from a mobile `BottomNavigation`
layout to a persistent `Drawer` with multi-column grids on wider viewports.

## Open decisions for theme adoption

These are deliberately deferred to the theme specification/plan, not settled
here:

1. **Dark mode** — the config ships a full dark scheme (`colorSchemeSelector:
   'class'`). Decide whether to expose a user toggle, follow the OS, or both.
2. **Font sourcing** — how Nunito / Nunito Sans are delivered without violating
   the public-repo and privacy rules (no maintainer-specific external URLs;
   prefer self-hosted or a documented, neutral source).
3. **Responsive navigation** — RESOLVED. The switch point is the `md`
   breakpoint (`BottomNavigation` below it, persistent `Drawer` at and above
   it); see `docs/specifications/navigation-shell/`.
4. **Retrofit order** — which existing feature (`admin-inventory`) adopts the
   theme first, and how to keep the change behavior-preserving.
