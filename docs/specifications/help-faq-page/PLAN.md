# In-app help / FAQ page — implementation plan

| Field | Value |
| --- | --- |
| Slug | `help-faq-page` |
| Status | Approved |
| Spec | [SPEC.md](./SPEC.md) (Approved 2026-07-12) |
| Created | 2026-07-12 |

## Goal

Ship the `/help` screen and its "Help" navigation entry exactly as scoped in
the approved SPEC: a static, role-filtered explanation of the application,
reusing the codebase's existing navigation-destination filtering pattern and
screen/test conventions. No new architecture, no Firebase change, no domain
logic — presentation and content only.

## Architecture, stack, and constraints (inherited from the repository)

- React + TypeScript + Vite + Material UI, `HashRouter`, `i18next`/`react-i18next`.
- One-component-one-folder; named exports only
  (`import-x/no-default-export: 'error'`, `eslint.config.js:47`) — every new
  component, hook, and util is `export const`, never `export default`.
- No barrel (`index.ts`) files anywhere under `src/features/` or
  `src/shared/components/AppShell/` today — new modules are imported by their
  full path, matching that convention.
- `uk` is the default locale, `en` the fallback; every new key goes into both
  `src/locales/uk/translation.json` and `src/locales/en/translation.json` in
  the same change, or `src/locales/__tests__/localeParity.test.ts` fails.
- `npm run verify` (typecheck → lint/Prettier → format:check → test → build)
  is the single gate; `npm run fix` normalizes style before it.

## Scope

Implements SPEC goals 1–6 in full. Inherits all SPEC non-goals verbatim: no
contextual "?" deep links from other screens, no first-visit tour/localStorage
gating, no in-app content editor, no search/filter control, no screenshots or
new image assets, no change to the existing `/settings` guard or any existing
destination's `roles`.

## Deep impact analysis

| Area | Planning detail |
| --- | --- |
| Architecture | New feature folder `src/features/help/` (`pages/`, `components/QuickStartSteps/`, `components/HelpTopics/`, `types/`, `constants/`, `utils/`, `__tests__/` — mirrors `src/features/settings/` and `src/shared/components/AppShell/`'s `types/constants/utils` split). One new entry in the existing `navigationDestinations` array. One new route in the existing `AppRouter`. No change to `domain/` or `infrastructure/`. |
| Data/domain | Two new static, in-memory data arrays (`quickStartSteps`, `helpTopicSections`), each entry typed with a `roles: UserRole[]` field filtered by the already-defined `UserRole = 'admin' \| 'user'`. No persistence, no time/units/concurrency concerns — content is bundled at build time. |
| Firebase | None. No converter, query, index, Rule, Auth, or transaction touched. |
| Migration | None. Purely additive; nothing to backfill or migrate. |
| Privacy/i18n | All new copy is generic, non-personal UI text. New `help.*` and `nav.help` keys added to both `uk` and `en` in the same commit-sized step every time; `localeParity.test.ts` re-run after each content-adding task. |
| UX | New route `/help`, inside the existing authenticated `AppShell` layout route, no `RequireAdmin` guard (matches `/menu`, `/orders`). Static content only — a single "ready" state, no loading/empty/error states to design. Accordion uses MUI's built-in keyboard/`aria-expanded` semantics; quick-start steps render as a semantic ordered list. |
| Quality | Unit tests for the two new role-filter functions (mirrors `selectDestinations.test.ts`), a component test for `HelpPage` (mirrors `SettingsPage.test.tsx`), extended assertions in `selectDestinations.test.ts` and `AppShell.test.tsx` for the new nav entry, locale-parity test, and the full `npm run verify` gate. |

## Conflicts

No conflicts found. The nav-destination and role-filter patterns already exist
and are extended, not altered; no existing destination's `roles` or route
guard changes; `/settings` stays admin-only as today.

## Affected paths and interfaces

New:
- `src/features/help/types/helpContent.ts` — `QuickStartStep`, `HelpTopicSection` interfaces.
- `src/features/help/constants/helpContent.ts` — `quickStartSteps: QuickStartStep[]`, `helpTopicSections: HelpTopicSection[]`.
- `src/features/help/utils/selectHelpContent.ts` — `selectQuickStartSteps(role)`, `selectHelpTopics(role)`.
- `src/features/help/utils/__tests__/selectHelpContent.test.ts`
- `src/features/help/components/QuickStartSteps/QuickStartSteps.tsx` (+ `.styles.ts` if needed)
- `src/features/help/components/HelpTopics/HelpTopics.tsx` (+ `.styles.ts` if needed)
- `src/features/help/pages/HelpPage.tsx`, `src/features/help/pages/HelpPage.styles.ts`
- `src/features/help/pages/__tests__/HelpPage.test.tsx`

Edited:
- `src/shared/components/AppShell/constants/navigationDestinations.ts` — add the `help` entry.
- `src/shared/components/AppShell/utils/__tests__/selectDestinations.test.ts` — extend the two `toEqual` order assertions.
- `src/shared/components/AppShell/__tests__/AppShell.test.tsx` — extend mobile-admin, mobile-user, and desktop assertions with the Help link.
- `src/app/router.tsx` — add the `/help` route.
- `src/locales/en/translation.json`, `src/locales/uk/translation.json` — add `nav.help` and the `help` block.

## Tasks

### Task 1 — Nav destination and route registration

Depends on: nothing (first task).

1. [ ] **RED** — edit `src/shared/components/AppShell/utils/__tests__/selectDestinations.test.ts`: add `'help'` to the admin `toEqual` array immediately before `'settings'` (`['menu', 'admin', 'orders', 'dishes', 'inventory', 'batches', 'help', 'settings']`) and to the user `toEqual` array at the end (`['menu', 'myOrders', 'help']`). Run
   `npx vitest run src/shared/components/AppShell/utils/__tests__/selectDestinations.test.ts`
   and confirm it fails (the catalog has no `help` entry yet).
2. [ ] **GREEN** — add
   `import HelpOutline from '@mui/icons-material/HelpOutline';`
   and one new entry
   `{ key: 'help', path: '/help', labelKey: 'nav.help', Icon: HelpOutline, roles: ['admin', 'user'] }`
   to `navigationDestinations.ts`, positioned immediately before the `settings` entry. Re-run the same test file and confirm it passes.
3. [ ] Add `"help": "Довідка"` / `"Help"` under `nav` in
   `src/locales/uk/translation.json` and `src/locales/en/translation.json`,
   plus a minimal placeholder block:
   `"help": { "title": "Довідка" }` / `"help": { "title": "Help" }`. Run
   `npx vitest run src/locales/__tests__/localeParity.test.ts` and confirm it passes.
4. [ ] Create `src/features/help/pages/HelpPage.tsx` as a minimal placeholder:
   ```tsx
   import Typography from '@mui/material/Typography';
   import { useTranslation } from 'react-i18next';

   export const HelpPage = () => {
     const { t } = useTranslation();
     return <Typography variant="h1">{t('help.title')}</Typography>;
   };
   ```
5. [ ] Edit `src/app/router.tsx`: import `HelpPage` and add
   `<Route path="/help" element={<HelpPage />} />` next to the existing
   `/menu`/`/orders` routes (no `RequireAdmin` wrapper), placed before the
   `/settings` route.
6. [ ] **RED** — edit `src/shared/components/AppShell/__tests__/AppShell.test.tsx`:
   add `expect(screen.getByRole('link', { name: i18n.t('nav.help') })).toBeInTheDocument();`
   to the mobile-admin block (~line 100-123), the mobile-user block
   (~line 125-142), and the desktop block (~line 183-201). Run
   `npx vitest run src/shared/components/AppShell/__tests__/AppShell.test.tsx`
   and confirm it now passes (the nav entry from step 2 already makes this
   green — this step verifies rendering, not just the data array).
7. [ ] Verification: `npx vitest run src/shared/components/AppShell` and
   `npx vitest run src/locales/__tests__/localeParity.test.ts` green.

Deliverable: a reviewable "Help" link that renders a placeholder title,
positioned correctly for both roles, with all touched tests green.

### Task 2 — Content model (quick-start steps and topic sections)

Depends on: Task 1 (uses the same `UserRole` type; no code dependency beyond that).

1. [ ] Create `src/features/help/types/helpContent.ts`:
   ```ts
   import type { SvgIconComponent } from '@mui/icons-material';
   import type { UserRole } from '../../../shared/types/userProfile';

   export interface QuickStartStep {
     key: string;
     titleKey: string;
     bodyKey: string;
     roles: UserRole[];
   }

   export interface HelpTopicSection {
     key: string;
     titleKey: string;
     descriptionKey: string;
     Icon: SvgIconComponent;
     roles: UserRole[];
   }
   ```
2. [ ] **RED** — create `src/features/help/utils/__tests__/selectHelpContent.test.ts`
   asserting (mirroring `selectDestinations.test.ts`'s style):
   - `selectQuickStartSteps('admin')` → `['browseMenu', 'reserveOrRequest', 'trackOrder', 'processRequests']`
   - `selectQuickStartSteps('user')` → `['browseMenu', 'reserveOrRequest', 'trackOrder']`
   - `selectHelpTopics('admin')` → all 8 keys in declared order: `['menuBrowse', 'myOrders', 'languageAndTheme', 'cookingRequests', 'dishesAndRecipes', 'inventoryAndStock', 'preparedBatches', 'mealTimeSettings']`
   - `selectHelpTopics('user')` → `['menuBrowse', 'myOrders', 'languageAndTheme']`
   - a "never leaks" case: `selectHelpTopics('user')` does not contain `'cookingRequests'`, `'dishesAndRecipes'`, `'inventoryAndStock'`, `'preparedBatches'`, or `'mealTimeSettings'`.
   Run `npx vitest run src/features/help/utils/__tests__/selectHelpContent.test.ts`
   and confirm it fails (module does not exist yet).
3. [ ] **GREEN** — create `src/features/help/constants/helpContent.ts` with the
   4 `quickStartSteps` and 8 `helpTopicSections` entries per the SPEC's tables,
   reusing existing icon imports for each topic:
   `RestaurantMenu` (menuBrowse), `ReceiptLong` (myOrders, cookingRequests),
   `LightMode` (languageAndTheme — the icon already used for the same
   drawer-footer control in `ColorSchemeMenuItem.tsx`), `LocalDining`
   (dishesAndRecipes), `Inventory2` (inventoryAndStock), `SoupKitchen`
   (preparedBatches), `Settings` (mealTimeSettings). `titleKey`/`descriptionKey`/
   `bodyKey` values point at `help.quickStart.steps.<key>.title`/`.body` and
   `help.topics.<key>.title`/`.description` (created in Task 3).
4. [ ] **GREEN** — create `src/features/help/utils/selectHelpContent.ts`:
   ```ts
   import { quickStartSteps, helpTopicSections } from '../constants/helpContent';
   import type { UserRole } from '../../../shared/types/userProfile';

   export const selectQuickStartSteps = (role: UserRole) =>
     quickStartSteps.filter(step => step.roles.includes(role));

   export const selectHelpTopics = (role: UserRole) =>
     helpTopicSections.filter(topic => topic.roles.includes(role));
   ```
   Re-run the test from step 2 and confirm it passes.

Deliverable: a fully tested, role-filtered content model with no UI yet —
independently reviewable as pure data/logic.

### Task 3 — Content authoring (uk/en copy)

Depends on: Task 2 (the key names referenced by `helpContent.ts` must exist).

1. [ ] Replace the placeholder `help` block in both
   `src/locales/uk/translation.json` and `src/locales/en/translation.json`
   with the full structure:
   ```json
   "help": {
     "title": "…",
     "intro": { "body": "…" },
     "quickStart": {
       "title": "…",
       "steps": {
         "browseMenu": { "title": "…", "body": "…" },
         "reserveOrRequest": { "title": "…", "body": "…" },
         "trackOrder": { "title": "…", "body": "…" },
         "processRequests": { "title": "…", "body": "…" }
       }
     },
     "topics": {
       "menuBrowse": { "title": "…", "description": "…" },
       "myOrders": { "title": "…", "description": "…" },
       "languageAndTheme": { "title": "…", "description": "…" },
       "cookingRequests": { "title": "…", "description": "…" },
       "dishesAndRecipes": { "title": "…", "description": "…" },
       "inventoryAndStock": { "title": "…", "description": "…" },
       "preparedBatches": { "title": "…", "description": "…" },
       "mealTimeSettings": { "title": "…", "description": "…" }
     }
   }
   ```
   Copy is plain-language per the SPEC (no "Firestore", "role", "transaction",
   etc.); `uk` is written first, `en` is a faithful translation.
2. [ ] Structural check —
   `npx vitest run src/locales/__tests__/localeParity.test.ts` passes (every
   path added to `uk` has an exact match in `en` and vice versa).

Deliverable: final bilingual copy, independently reviewable as a content-only
diff with no code changes.

### Task 4 — UI assembly

Depends on: Task 2 (data), Task 3 (copy), Task 1 (page file already exists as
a placeholder to replace).

1. [ ] **RED** — create `src/features/help/pages/__tests__/HelpPage.test.tsx`,
   mirroring `SettingsPage.test.tsx`'s render/mock setup (`I18nextProvider` with
   the real `i18n` instance, MUI `ThemeProvider` with the real `theme`,
   `vi.mock('../../auth/useAuth', ...)` returning a fixed `role`). Two cases:
   - role `admin`: heading `help.title` is present; all 4 quick-start step
     titles are present in order; all 8 topic titles are present as accordion
     summaries.
   - role `user`: only the 3 shared quick-start step titles and 3 shared topic
     titles are present; an admin-only topic title (e.g.
     `help.topics.cookingRequests.title`) is absent (`queryByText`).
   Run `npx vitest run src/features/help/pages/__tests__/HelpPage.test.tsx` and
   confirm it fails (the placeholder page renders none of this).
2. [ ] **GREEN** — create `src/features/help/components/QuickStartSteps/QuickStartSteps.tsx`:
   accepts `steps: QuickStartStep[]`, renders a semantic ordered list
   (`Box component="ol"`), each item (`Box component="li"`) showing
   `t(step.titleKey)` and `t(step.bodyKey)`.
3. [ ] **GREEN** — create `src/features/help/components/HelpTopics/HelpTopics.tsx`:
   accepts `topics: HelpTopicSection[]`, renders one MUI `Accordion` per topic
   with `<topic.Icon />` + `t(topic.titleKey)` in `AccordionSummary` and
   `t(topic.descriptionKey)` in `AccordionDetails`.
4. [ ] **GREEN** — replace the placeholder `HelpPage.tsx` with the full page:
   reads `role` from `useAuth()`, computes
   `selectQuickStartSteps(role)`/`selectHelpTopics(role)` (empty arrays while
   `role` is `undefined`), and renders, in order: page title (`help.title`),
   intro paragraph (`help.intro.body`, unconditional), quick-start title +
   `<QuickStartSteps />`, `<HelpTopics />`. Add `HelpPage.styles.ts` mirroring
   `SettingsPage.styles.ts`'s `Record<string, SxProps<Theme>>` shape if any
   custom spacing is needed beyond `Stack`'s `spacing` prop.
   Re-run the test from step 1 and confirm it passes.

Deliverable: the complete, role-correct `/help` screen, independently
reviewable end-to-end via its component test.

### Task 5 — Integration verification

Depends on: Tasks 1–4 complete.

1. [ ] `npm run fix` (ESLint `--fix` then Prettier `--write`) to normalize any
   formatting across the new/edited files.
2. [ ] `npm run verify` (typecheck → lint/Prettier → format:check → test →
   build) and confirm it is fully green. Fix any fallout before proceeding.
3. [ ] Manual smoke check (not a substitute for step 2): sign in as each role
   in the emulator/dev build and confirm `/help` shows the expected step/topic
   counts and the nav entry sits before Settings.

Deliverable: a fully green `npm run verify` run — the state required before
the primary agent marks this specification's index entry `Implemented`.

## Acceptance criteria → task mapping

| SPEC acceptance criterion | Task(s) |
| --- | --- |
| Help entry visible to both roles, positioned before Settings | Task 1 |
| `/help` reachable without admin guard | Task 1 |
| Intro identical regardless of role | Task 4 |
| Quick-start shows 3 steps (user) / 4 steps (admin), in order | Task 2, Task 4 |
| Topic accordion shows 3 (user) / 8 (admin) topics, no leakage | Task 2, Task 4 |
| Each topic's icon matches its capability's existing nav icon | Task 2 |
| No screenshots/illustrations/new image assets | Task 4 (verified by file review — no image files added) |
| All new strings in both `uk` and `en`; parity test passes | Task 1, Task 3 |
| `npm run verify` passes | Task 5 |

## Documentation, rollout, rollback

- **Documentation**: no `docs/0X-*.md` file needs a content change — this
  feature adds no architecture, schema, security, or deployment decision (per
  `AGENTS.md`'s documentation-update trigger). No design-screen doc is added;
  the approved SPEC did not include one in its milestones.
- **Rollout**: fully additive; ships in one change, no feature flag needed.
- **Rollback**: remove the `help` entry from `navigationDestinations.ts`, the
  `/help` route from `router.tsx`, the `src/features/help/` folder, and the
  `nav.help`/`help.*` locale keys (checked by the parity test either way).

## Risks

- None identified beyond ordinary review risk (copy tone, icon choice for
  `languageAndTheme`, which has no existing nav-destination icon of its own —
  documented in Task 2 as reusing the drawer footer's own `LightMode` icon).

## Open questions (non-blocking)

None. Carries forward the SPEC's single non-blocking open question (future
contextual "?" deep links), which does not affect this plan's tasks.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-12 | Draft |
| Approver | User | 2026-07-12 | Approved |
