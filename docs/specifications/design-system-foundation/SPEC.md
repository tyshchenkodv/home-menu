# Design system foundation specification

| Field | Value |
| --- | --- |
| Slug | `design-system-foundation` |
| Status | Approved |
| Request | Adopt the designer mockup as the app's Material UI theme, brand header, and illustration primitive |
| Created | 2026-07-09 |
| Related artifacts | `docs/design/README.md` (design canon); visual reference `design/Home Menu.html`; no prior SPEC |

## Problem statement

The intended product look and feel is defined in a designer mockup bundle
(`design/Home Menu.html`) and transcribed into the machine-readable canon at
`docs/design/README.md`. The running application does not yet reflect it:
`src/app/theme.ts` is a light-only stub with no palette, typography, spacing,
radii, or component overrides; no fonts are wired; there is no brand header; and
the cat mascot (`CatArt`) illustration system from the design does not exist.

The mockup also shows a persistent top header carrying the brand mascot, the
"Home Menu" wordmark, a language switcher, and (per the interview) a dark-mode
toggle. Language persistence already exists in `src/app/i18n.ts`, but no
user-facing control surfaces it, and there is no dark mode at all.

This slice establishes the shared visual foundation so the existing
`admin-inventory` feature can later be restyled and future features can build
directly against the theme, instead of every feature re-deriving colors,
typography, and tone from an opaque bundle no agent can read.

## Goals

1. Populate `src/app/theme.ts` from the design canon: full `light` and `dark`
   color schemes, typography (Nunito / Nunito Sans), 8px spacing, per-surface
   radii, and the documented Material UI component overrides, using MUI CSS
   variables.
2. Self-host the Nunito and Nunito Sans fonts (including Cyrillic subsets) with
   no external font requests, so the rendered UI matches the design in both
   `uk` and `en`.
3. Provide user-controlled dark mode as a single binary light↔dark toggle whose
   choice persists across reloads. No OS-driven `system` mode.
4. Provide a `LanguageSwitcher` control (`UK` / `EN` labels, `uk` / `en` codes)
   that switches locale and relies on the existing persistence in
   `src/app/i18n.ts`.
5. Provide a minimal persistent `AppHeader` containing the brand mascot, the
   "Home Menu" wordmark, the language switcher, and the dark-mode toggle,
   rendered on application pages.
6. Provide a `CatArt` illustration component reproducing the design mascot, with
   `content`, `confused`, and `sleeping` variants and a `size` prop, using
   theme-aware colors so it adapts to light and dark.
7. Verify the foundation through component tests, a theme smoke test, locale
   parity, and visual proof in both schemes and locales.

## Non-goals

- Restyling the existing `admin-inventory` screens (separate follow-up slice).
- Building navigation (`BottomNavigation` / `Drawer`) or any routed
  destinations; the header carries brand and global controls only, not nav.
- Building a Settings screen or default-meal-times UI.
- Rendering `CatArt` empty/error states inside feature screens (only the
  component and its variants are delivered here; screens consume them later).
- Changing any domain logic, Firebase schema, Rules, queries, or transactions.
- Pixel-perfect reproduction of the mockup; the design is directional and the
  canon values win where they differ.

## Design source of truth

- `docs/design/README.md` is the canonical, readable design system. The theme
  values in this slice are transcribed from its authoritative `createTheme`
  block.
- `design/Home Menu.html` is a human visual reference only.
- Where the two disagree, `docs/design/README.md` wins.

## Behavior and configuration

### Color scheme (dark mode)

- The theme declares both `light` and `dark` schemes via MUI `colorSchemes`,
  with `cssVariables` enabled.
- Selection is a binary user choice (`light` or `dark`); default is `light`.
  There is no `system` mode.
- The toggle is a single button that flips the mode; the selected mode persists
  in `localStorage` and is restored on reload.
- Implementation defaults recorded here (non-blocking): `colorSchemeSelector:
  'data'`; `defaultMode: 'light'`; the mode storage key follows the existing
  `home-menu-*` convention (aligning with `home-menu-language`).

### Language

- `LanguageSwitcher` offers `uk` and `en`, displayed as `UK` and `EN`.
- The visible label `UK` is chosen deliberately over the mockup's `UA`: the
  code is and remains `uk`, and `ua` must never appear as a language code.
- Switching calls the i18next instance; persistence is already handled by the
  `languageChanged` listener in `src/app/i18n.ts`. No new persistence code.

### Header

- `AppHeader` renders: `CatArt` (`content` variant) as the brand mark, the
  "Home Menu" wordmark, `LanguageSwitcher`, and the dark-mode toggle.
- It is a shared layout element rendered on application pages. Its placement is
  intentionally minimal and relocatable into a future app shell without
  changing the controls themselves.

### CatArt

- One component with a `variant` (`content` | `confused` | `sleeping`) and a
  `size` prop. Faithful SVG reproduction of the design mascot; colors reference
  the theme palette / `currentColor` so both schemes render correctly.

## UX and accessibility

- Roles: the header and its controls are available to any authenticated user;
  no role gating is introduced by this slice.
- The dark-mode toggle and language control are keyboard accessible with visible
  focus and accessible names sourced from i18next (not inline strings).
- The mascot is decorative in the header and is exposed to assistive technology
  accordingly (no misleading alternative text).
- Loading/empty/error/ready: this slice introduces no async data surfaces; the
  header and controls have a single ready state. `CatArt` variants exist to
  serve feature empty/error states in later slices.

## Impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | Changes `app` (`theme.ts`, `AppProviders`, font imports, header composition). Adds shared UI under `shared/components/` (`AppHeader`, `LanguageSwitcher`, `ColorSchemeToggle`, `CatArt`), one component per folder per `frontend-architecture`. No `domain`, `infrastructure`, or feature logic changes. |
| Firebase | No schema, converters, queries, indexes, Rules, Auth, or transaction changes. Not applicable. |
| Domain | No invariants, units, statuses, time, or concurrency changes. Not applicable. |
| Privacy | Fonts are self-hosted npm packages; no external font host, no maintainer-specific URLs, no personal data. Mascot SVG and theme tokens carry no identities. Public-repository safe. |
| i18n | Adds keys for the language control and dark-mode toggle accessible names to both `uk` and `en`; `localeParity.test.ts` enforces parity. `uk` stays default, `en` fallback. No user data becomes translatable. |
| UX | Adds a persistent header and two global controls. No new routes or permissions. Dark mode is a new, reversible, non-destructive user preference. |
| Compatibility | Additive: existing pages gain a header and inherit themed styling. No stored data or deployed contract changes. Reverting is limited to UI. Existing `admin-inventory` component tests wrap pages in `ThemeProvider`; a richer theme must not break them (verified in Quality). |
| Quality | Component tests for `ColorSchemeToggle`, `LanguageSwitcher`, `CatArt`, and `AppHeader`; a theme smoke test asserting `light` + `dark` schemes and key palette tokens; automatic locale parity; visual proof (light/dark × `uk`/`en`) via the preview dev server. Update `docs/design/README.md` adoption status and relevant current docs. |

## Acceptance criteria

- [ ] `src/app/theme.ts` exposes `light` and `dark` color schemes with the
      canon palette, typography, spacing (`8`), radii, and component overrides,
      using CSS variables.
- [ ] Nunito and Nunito Sans (with Cyrillic subsets) are self-hosted with no
      external font requests; headings and body render in the design typefaces
      for both `uk` and `en`.
- [ ] A single dark-mode toggle flips light↔dark; the choice persists across a
      reload; there is no `system` mode.
- [ ] `LanguageSwitcher` shows `UK` / `EN`, switches locale, and the choice
      persists via the existing i18next listener; no `ua` code is introduced.
- [ ] A persistent `AppHeader` renders the `CatArt` brand mark, the wordmark,
      the language switcher, and the dark-mode toggle on application pages.
- [ ] `CatArt` renders `content`, `confused`, and `sleeping` variants, honors
      `size`, and displays correctly in both schemes.
- [ ] Control accessible names come from i18next with matching `uk` / `en`
      keys; `localeParity.test.ts` passes.
- [ ] Component tests, the theme smoke test, and existing `admin-inventory`
      tests pass; visual proof is captured in both schemes and locales.

## Milestones

1. Theme foundation: `theme.ts` schemes, fonts, `AppProviders` wiring, smoke
   test.
2. Global controls: `ColorSchemeToggle`, `LanguageSwitcher`, i18n keys, tests.
3. `CatArt` component with all variants and tests.
4. `AppHeader` composition, app-wide rendering, tests.
5. Verification: full test run, visual proof, documentation update.

## Open questions (non-blocking)

- Exact whisker/facial SVG geometry per `CatArt` variant is an implementation
  detail resolved by faithful transcription from the design during the plan.
- Whether the header should be hidden on the login route can be decided during
  implementation; default is to render it app-wide unless it visibly conflicts
  with the login layout.

## References

- Design canon: `docs/design/README.md`.
- Visual reference: `design/Home Menu.html`.
- Current wiring: `src/app/theme.ts`, `src/app/providers/AppProviders.tsx`,
  `src/app/i18n.ts`, `src/app/router.tsx`.
- Frontend conventions: `.agents/skills/frontend-architecture/SKILL.md`.
- Test patterns: `src/test/setup.ts`,
  `src/locales/__tests__/localeParity.test.ts`.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-09 | Submitted for review |
| Approver | Dmytro Tyshchenko | 2026-07-09 | Approved |
