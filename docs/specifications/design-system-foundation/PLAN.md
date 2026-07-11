# Design system foundation plan

| Field | Value |
| --- | --- |
| Slug | `design-system-foundation` |
| Status | Approved |
| Specification | [SPEC.md](./SPEC.md) (Approved 2026-07-09) |
| Created | 2026-07-09 |

## Goal

Implement the approved design system foundation: a full light/dark Material UI
theme from the design canon, self-hosted Nunito fonts, a persistent brand
header, user-controlled dark mode, a language switcher, and the `CatArt`
illustration primitive — verified by tests and visual proof.

## Architecture and stack

- React + TypeScript + Vite + Material UI v9 (`cssVariables` + `colorSchemes`),
  `react-i18next`, Vitest + React Testing Library + `userEvent`.
- New shared UI lives under `src/shared/components/<Component>/` — one component
  per folder, `sx` extracted to a sibling `.styles.ts` when used, per
  `frontend-architecture`. This slice creates `src/shared/components/`.
- Theme source of truth: `docs/design/README.md`. Values are transcribed, not
  invented.

## Global constraints

- No `export default` in components (named exports only).
- All user-facing strings (labels, aria-labels) come from i18next with matching
  `uk` and `en` keys; `uk` default, `en` fallback.
- The language code is `uk`; `ua` must never appear. Visible label is `UK`.
- Fonts self-hosted; no external font requests.
- Pin new dependencies to exact versions (`--save-exact`, no `^`).
- No staging, committing, or pushing during implementation.

## Scope

In: `theme.ts`, fonts, `AppProviders` header wiring, and four shared components
(`ColorSchemeToggle`, `LanguageSwitcher`, `CatArt`, `AppHeader`).

Inherited non-goals (from SPEC): no admin-inventory restyle, no navigation, no
Settings screen, no feature-screen consumption of `CatArt`, no domain/Firebase
changes, no pixel-perfect reproduction.

## Impact analysis

| Area | Planning detail |
| --- | --- |
| Architecture | Modifies `src/app/theme.ts`, `src/app/providers/AppProviders.tsx`, `src/main.tsx`. Adds `src/app/fonts.ts` and `src/shared/components/{ColorSchemeToggle,LanguageSwitcher,CatArt,AppHeader}/`. Dependency direction: shared components depend on MUI, theme, and i18n only — never on features. |
| Data/domain | No domain data. UI-only state: color-scheme mode (MUI-managed, `localStorage`) and language (i18next-managed, existing `home-menu-language` key). No invariants, units, or concurrency. |
| Firebase | None. Not applicable. |
| Migration | Additive. No stored-data or contract change. Rollback is limited to reverting UI; no data cleanup needed. |
| Privacy/i18n | Fonts are self-hosted npm packages (no external host, no maintainer URLs). New keys under `common` added to both locales; `localeParity.test.ts` enforces parity. No new user data becomes translatable. |
| UX | Adds a persistent header with two global controls; no routes or roles change. Controls are keyboard accessible with visible focus and i18n accessible names. Dark mode is a reversible preference. |
| Quality | TDD per component; theme smoke test; automatic locale parity; full `test`/`lint`/`typecheck`/`build`; visual proof via the preview dev server (light/dark × uk/en); docs updated. |

## Conflicts investigated

- **Existing tests vs. richer theme:** `admin-inventory` page tests import
  `theme` and wrap pages in `ThemeProvider`. A fuller theme is additive; Task 1
  reruns them to confirm no regressions. No conflict expected.
- **Header vs. existing page tests:** those tests render pages directly, not
  through `AppProviders`, so the new header does not appear in them and cannot
  break their queries. No conflict.
- **Wordmark string:** `app.title` already localizes the product name. The
  header uses `app.title` rather than a hardcoded "Home Menu", honoring the
  i18n rule; the mockup's English wordmark is directional. No conflict.
- **Test webstorage:** the `test` script runs with
  `--no-experimental-webstorage` so jsdom's `localStorage` backs both i18n and
  MUI persistence. No conflict.

No blocking conflicts found.

## Affected paths and interfaces

- `src/app/theme.ts` — `createTheme` with `cssVariables: { colorSchemeSelector:
  'data' }`, `defaultMode: 'light'`, `colorSchemes: { light, dark }`, `spacing:
  8`, `shape.borderRadius: 14`, typography, and `components` overrides.
- `src/app/fonts.ts` — subset CSS imports for `@fontsource-variable/nunito` and
  `@fontsource-variable/nunito-sans` (latin + cyrillic [+ cyrillic-ext]).
- `src/main.tsx` — import `./app/fonts`.
- `src/app/providers/AppProviders.tsx` — render `<AppHeader />` above
  `children` (inside `ThemeProvider`/`CssBaseline`).
- `src/shared/components/ColorSchemeToggle/ColorSchemeToggle.tsx` —
  `() => JSX`; single `IconButton` using `useColorScheme()`.
- `src/shared/components/LanguageSwitcher/LanguageSwitcher.tsx` —
  `() => JSX`; UK/EN control calling `i18n.changeLanguage`.
- `src/shared/components/CatArt/CatArt.tsx` —
  `({ variant, size }: { variant: 'content' | 'confused' | 'sleeping'; size?: number }) => JSX`.
- `src/shared/components/AppHeader/AppHeader.tsx` — `() => JSX` composing the
  above plus the `app.title` wordmark.
- `src/locales/{uk,en}/translation.json` — new `common` keys.

## New i18n keys (both locales)

- `common.toggleDarkMode` — dark-mode toggle accessible name.
- `common.language` — language control accessible name / group label.
- `common.languageUk` = `UK`, `common.languageEn` = `EN` — visible option
  labels (identical text in both locales, routed through i18n per rule).

## Tasks

### Task 1 — Theme foundation, fonts, smoke test

Depends on: none.

- [ ] Add `src/app/__tests__/theme.test.ts` asserting `theme.colorSchemes.light`
      and `.dark` exist with canon tokens (`primary.main` `#E36397` light /
      `#F49CBF` dark, `background.default` `#FDF2F6` / `#1E1A1D`), `spacing(2)
      === '16px'` (or unit 8), and `shape.borderRadius === 14`.
- [ ] Run `npm run test -- src/app/__tests__/theme.test.ts` → **RED** (stub
      theme lacks schemes).
- [ ] Install fonts: `npm install --save-exact @fontsource-variable/nunito
      @fontsource-variable/nunito-sans`. Record resolved exact versions.
- [ ] Create `src/app/fonts.ts` importing the latin + cyrillic (and
      cyrillic-ext if published) subset CSS. Verify the exact export paths from
      the installed package layout before finalizing (discovery step, not a
      guess).
- [ ] Import `./app/fonts` in `src/main.tsx`.
- [ ] Rewrite `src/app/theme.ts` from the canon `createTheme` block, using
      `colorSchemeSelector: 'data'` and `defaultMode: 'light'`.
- [ ] Run the theme test → **GREEN**. Run `npm run test` and `npm run
      typecheck` → existing `admin-inventory` tests still pass.

Deliverable: themed foundation with fonts; smoke test green.

### Task 2 — ColorSchemeToggle

Depends on: Task 1.

- [ ] Add `common.toggleDarkMode` to both locale files.
- [ ] Add `src/shared/components/ColorSchemeToggle/__tests__/ColorSchemeToggle.test.tsx`:
      render inside `ThemeProvider theme={theme}`; assert initial mode is light
      (probe `document.documentElement` `data-mui-color-scheme` or a `useColorScheme`
      probe); `userEvent.click` the toggle → mode becomes `dark`; a second click
      → `light`.
- [ ] Run focused test → **RED**.
- [ ] Implement `ColorSchemeToggle` with `useColorScheme()` (`setMode(mode ===
      'dark' ? 'light' : 'dark')`), an `IconButton` with a light/dark icon and
      `aria-label` from `common.toggleDarkMode`.
- [ ] Run focused test → **GREEN**; `npm run lint` clean.

Deliverable: persistent, accessible dark-mode toggle with test.

### Task 3 — LanguageSwitcher

Depends on: Task 1.

- [ ] Add `common.language`, `common.languageUk`, `common.languageEn` to both
      locales.
- [ ] Add `src/shared/components/LanguageSwitcher/__tests__/LanguageSwitcher.test.tsx`:
      render inside `I18nextProvider i18n={i18n}`; assert `UK`/`EN` controls;
      `beforeEach` clears `localStorage` and resets language to `uk`; click `EN`
      → `i18n.language === 'en'` and
      `localStorage.getItem('home-menu-language') === 'en'`.
- [ ] Run focused test → **RED**.
- [ ] Implement `LanguageSwitcher` (e.g. `ToggleButtonGroup` or segmented
      control) calling `i18n.changeLanguage`; visible labels from i18n; group
      `aria-label` from `common.language`. Persistence relies on the existing
      `languageChanged` listener — no new persistence code.
- [ ] Run focused test → **GREEN**; `npm run lint` clean.

Deliverable: UK/EN switcher with persistence test.

### Task 4 — CatArt

Depends on: Task 1.

- [ ] Extract the mascot SVG geometry for `content`, `confused`, and `sleeping`
      from `design/Home Menu.html` (transcription from the design; not invented).
- [ ] Add `src/shared/components/CatArt/__tests__/CatArt.test.tsx`: for each
      variant, render and assert an `<svg>` is present; assert `size` maps to
      the rendered width/height.
- [ ] Run focused test → **RED**.
- [ ] Implement `CatArt` with the three variants and `size` prop; colors via
      theme palette / `currentColor` so both schemes render correctly; mascot
      exposed to assistive tech appropriately (decorative in header usage).
- [ ] Run focused test → **GREEN**; `npm run lint` clean.

Deliverable: `CatArt` with all variants and test.

### Task 5 — AppHeader and wiring

Depends on: Tasks 2, 3, 4.

- [ ] Add `src/shared/components/AppHeader/__tests__/AppHeader.test.tsx`: render
      inside `I18nextProvider` + `ThemeProvider`; assert the `CatArt` brand mark,
      the `app.title` wordmark, the language switcher, and the dark-mode toggle
      are present.
- [ ] Run focused test → **RED**.
- [ ] Implement `AppHeader` composing `CatArt` (`content`), the `app.title`
      wordmark, `LanguageSwitcher`, and `ColorSchemeToggle`; extract `sx` to
      `AppHeader.styles.ts`.
- [ ] Render `<AppHeader />` above `children` in `AppProviders.tsx`.
- [ ] Run focused test → **GREEN**; run `npm run test` (full) → all green,
      including unchanged `admin-inventory` tests.

Deliverable: persistent header rendered app-wide, with test.

### Task 6 — Verification and documentation

Depends on: Tasks 1–5.

- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
      → all pass.
- [ ] Visual proof via the preview dev server: capture the header in light and
      dark schemes and in `uk` and `en` (four states), confirming fonts,
      palette, and mascot render as designed.
- [ ] Update `docs/design/README.md` "Status of adoption" to reflect the wired
      theme, fonts, header, and `CatArt`.
- [ ] Update `docs/05-components-and-flows.md` (and any other affected current
      doc) to describe the theme, header, and shared components.
- [ ] Mark the specifications index entry `Implemented`.

Deliverable: fully verified slice with visual proof and updated docs.

## Acceptance-criteria mapping

| SPEC acceptance criterion | Task(s) | Verification |
| --- | --- | --- |
| `theme.ts` light+dark schemes, tokens, overrides | 1 | `theme.test.ts` + build |
| Self-hosted Nunito with Cyrillic, no external requests | 1 | `fonts.ts` review + visual proof (uk) + network check in preview |
| Binary dark toggle, persists, no `system` | 2 | `ColorSchemeToggle.test.tsx` + visual proof |
| UK/EN switcher, persists, no `ua` code | 3 | `LanguageSwitcher.test.tsx` + locale parity |
| Persistent `AppHeader` with brand, wordmark, controls | 5 | `AppHeader.test.tsx` + visual proof |
| `CatArt` content/confused/sleeping + `size`, both schemes | 4 | `CatArt.test.tsx` + visual proof |
| i18n keys with parity; accessible names | 2,3 | `localeParity.test.ts` |
| Component + smoke + existing tests pass; visual proof | 1–6 | full `npm run test` + preview screenshots |

## Documentation, rollout, rollback

- Documentation: update `docs/design/README.md` and
  `docs/05-components-and-flows.md`; mark the index `Implemented`.
- Rollout: additive; merging simply themes the app and adds the header.
- Rollback: revert the slice; no data migration or cleanup required.

## Risks

- **MUI v9 API surface** for `useColorScheme` / `colorSchemeSelector` — mitigated
  by the Task 1 smoke test and Task 2 behavior test catching mismatches early.
- **fontsource subset paths** vary by package version — mitigated by the
  explicit "verify export paths" discovery step before finalizing `fonts.ts`.
- **Flash of default scheme on load** in a CSR SPA — acceptable for this slice;
  MUI `InitColorSchemeScript` can be added later if it proves noticeable.

## Non-blocking open questions

- Whether to hide `AppHeader` on the login route — default renders app-wide;
  revisit if it visibly conflicts with the login layout during Task 5/6.
- Whether the language control is a segmented pill or icon-menu — an
  implementation choice bounded by the accessibility requirement; pill (as in
  the mockup) is preferred.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-09 | Submitted for review |
| Approver | Dmytro Tyshchenko | 2026-07-09 | Approved |
