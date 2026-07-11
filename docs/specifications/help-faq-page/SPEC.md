# In-app help / FAQ page

| Field | Value |
| --- | --- |
| Slug | `help-faq-page` |
| Status | Approved |
| Request | Add a left-navigation "Help" page that explains, in plain non-technical language, how to use the application — with content scoped to what the signed-in user's role can actually do |
| Created | 2026-07-12 |
| Related | [Navigation shell](../navigation-shell/SPEC.md) |

## Problem statement

Home Menu has no in-app guidance. A new household member or administrator has
no way to learn what the application does or how to perform a task other than
exploring screens by trial and error, or asking whoever set the system up.
`docs/01-overview.md` documents the roles and capabilities, but that document
is developer-facing repository documentation, not something a household member
opens.

There is currently no help/onboarding UI of any kind in the codebase (no
tooltip, tour, or FAQ component exists). This specification adds a dedicated
"Help" destination to the left navigation that explains, in plain language,
what the application is for and what the signed-in user can do with it, scoped
to their role.

## Goals

1. Add a "Help" navigation destination (`Довідка` / `Help`) visible to both
   `admin` and `user`, positioned immediately before "Settings" in the
   destination list, routed at `/help`.
2. Show a short, universal, non-technical introduction at the top of the page
   explaining what the application does — no internal terms (roles as an
   implementation concept, Firestore, transactions, etc.).
3. Show an always-visible "quick start" step list directly under the intro,
   describing the typical flow for the signed-in user's role using existing
   domain terms already shown elsewhere in the UI (dish, menu, order).
4. List every capability available to the signed-in user as an expandable
   (Accordion) topic section below the quick start. An `admin` sees the shared
   topics plus every admin-only topic; a `user` sees only the shared topics. No
   role sees a topic for a capability they cannot use.
5. Add every new string (nav label, page title, intro, quick-start steps,
   section titles/descriptions) to both `uk` and `en` resources; `uk` stays
   default, `en` stays fallback.
6. Reuse the existing MUI icons already used in the left navigation for each
   topic's icon — no new image assets.

## Non-goals

- Contextual "?" entry points on other screens that deep-link into a specific
  Help section. May follow as a later, separately specified enhancement.
- A first-visit auto-opening overlay/tour and any "seen this before" tracking
  (e.g. `localStorage`). The quick-start guide is a static block that always
  renders at the top of `/help`; the user opens `/help` themselves.
- In-app editing of Help content. Copy lives in code and locale resources like
  every other screen; there is no CMS, no admin editor for this content.
- A search or filter control within the Help page.
- Screenshots, photos, or newly authored illustrations of any kind.
- Changing the existing `/settings` route guard, the roles on any existing
  navigation destination, or the drawer's responsive behavior.
- Explaining features that are out of scope for the MVP (payments,
  notifications, shopping lists, multi-household, etc., per
  `docs/01-overview.md`). The page only documents what is actually built.

## Workflow, content, and route map

### Navigation and routing

| Destination | Route | Roles | Position |
| --- | --- | --- | --- |
| Help | `/help` | `admin`, `user` | Appended to `navigationDestinations` immediately before the existing `settings` entry, so it renders last but one in the drawer/bottom nav |

`/help` is added to the authenticated `AppShell` layout route in
`src/app/router.tsx` alongside `/menu` and `/orders` — reachable by any
authenticated, active profile, with no `RequireAdmin` guard.

### Page structure

The page renders three stacked blocks, top to bottom:

1. **Intro** — one fixed block, identical for every role: what the
   application is for and what the household sees, in plain language. Not
   filtered by role.
2. **Quick start** — a short, numbered step list for the signed-in role's
   typical scenario. Always rendered, not dismissible, not gated on
   first-visit state.
3. **Topics** — an `Accordion` list, one item per topic, filtered by role
   using the same "list entries carry a `roles` array, filter by the current
   role" pattern already used for `navigationDestinations`
   (`src/shared/components/AppShell/utils/selectDestinations.ts`).

### Quick-start steps

| Step | Roles | Content (summary) |
| --- | --- | --- |
| 1. Browse the menu | `admin`, `user` | Open Menu, pick a date and meal |
| 2. Reserve or request | `admin`, `user` | Reserve a ready portion, or send a cooking request if none is ready |
| 3. Track your order | `admin`, `user` | Check status and cancel (while allowed) from My orders |
| 4. Process requests | `admin` | Approve, reject, or start cooking a household member's request from Cooking requests |

An `admin` sees all four steps in order; a `user` sees only steps 1–3.

### Topic sections

| Topic key | Roles | Mirrors screen | Content (summary) |
| --- | --- | --- | --- |
| `menuBrowse` | `admin`, `user` | `/menu` | How dish availability works in plain terms (ready now / can be cooked / unavailable), how to reserve a portion or send a cooking request |
| `myOrders` | `admin`, `user` | `/orders` | Where to see active and past orders, when cancelling is still possible |
| `languageAndTheme` | `admin`, `user` | drawer footer controls | Switching UI language and light/dark appearance |
| `cookingRequests` | `admin` | `/admin/orders` | Reviewing, approving, rejecting, and completing household cooking requests |
| `dishesAndRecipes` | `admin` | `/admin/dishes` | Creating/editing dishes and defining the recipe (ingredients per standard batch) |
| `inventoryAndStock` | `admin` | `/admin/inventory` (+ history) | Tracking ingredient stock, restocking, corrections, and the movement history |
| `preparedBatches` | `admin` | `/admin/batches` | Registering actual cooked yield and discarding expired portions |
| `mealTimeSettings` | `admin` | `/settings` | Configuring default breakfast/lunch/dinner times |

An `admin` sees all eight sections; a `user` sees the first three
(`menuBrowse`, `myOrders`, `languageAndTheme`) only. The Admin Dashboard
(`/admin`) itself is not a separate topic — it is a summary screen that links
into the other admin screens, each already covered by its own topic; the intro
block mentions it exists.

## UX and accessibility

- `/help` has one steady state: static, bundled copy with no data fetching, so
  there is no loading, empty, or error state to design — only "ready".
- Section icons reuse the `Icon` already assigned to the matching entry in
  `navigationDestinations.ts` (e.g. the Menu topic uses the same icon as the
  Menu nav item), so a returning user recognizes the mapping.
- The `Accordion` list uses MUI's default expand/collapse semantics
  (`aria-expanded`, keyboard-operable summary control); only one or multiple
  sections may be open at a time per MUI's default (no custom single-open
  constraint required).
- Heading hierarchy: page title, then intro/quick-start/topics as labeled
  regions, each `Accordion` summary as its own heading level, following the
  existing screen heading conventions.
- All copy — nav label, title, intro, quick-start steps, topic titles and
  descriptions — comes from i18next; nothing is inlined in components.
- Mobile-first: the intro, quick start, and accordion stack in a single
  column, matching every other screen's mobile-first layout.

## Deep impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | New feature folder `src/features/help/` with `pages/HelpPage.tsx`, presentational subcomponents for the quick-start list and topic accordion (one-component-one-folder), and a data-only `constants/helpContent.ts` (quick-start steps and topic sections, each entry carrying a `roles` array — mirrors the shape and filtering approach of `navigationDestinations.ts`, but is a distinct, feature-owned list rather than a shared abstraction). `navigationDestinations.ts` gains one new entry (`key: 'help'`); `router.tsx` gains one new unguarded route inside the authenticated shell. No `domain/` or `infrastructure/` change. |
| Firebase | None. No schema, converter, query, index, Rule, Auth, or transaction change. |
| Domain | None. The page reads only the already-resolved `role` from `useAuth`/`usePermissions` to filter static content; no invariant, unit, status, time, or concurrency logic is added. |
| Privacy | None. All copy is generic, non-personal UI text in both locales; no identifiers, credentials, or household data. |
| i18n | New `faq` (or equivalently named) key block for the intro, quick-start steps, and topic titles/descriptions, plus a new `nav.help` label — added to both `uk` and `en`. Existing translation resources use flat nested objects only (no array values); step lists are represented as sequentially named keys (e.g. `step1`, `step2`) consistent with that convention. `uk` stays default, `en` stays fallback. `src/locales/__tests__/localeParity.test.ts` must stay green for the new keys. |
| UX | One new route, reachable by both roles, with no destructive actions and no forms. Role-based content filtering follows the same pattern already reviewed and shipped for navigation destinations. |
| Compatibility | Purely additive: one new nav entry, one new route, one new feature folder. No existing screen, route, or behavior changes. Rollback is removing the nav entry, the route, and the feature folder. |
| Quality | Component tests for `HelpPage`: an `admin` sees all 8 topic sections and all 4 quick-start steps in order; a `user` sees exactly the 3 shared topics and 3 shared steps and never sees an admin-only topic; the nav entry renders for both roles immediately before Settings. Locale-parity test extended to cover the new keys. `npm run verify` must pass. |

## Acceptance criteria

- [ ] A "Help" entry (`Довідка` / `Help`) appears in the left navigation for
      both `admin` and `user`, positioned immediately before "Settings".
- [ ] `/help` is reachable by any authenticated, active profile without an
      admin guard.
- [ ] The intro block is identical regardless of role.
- [ ] The quick-start list shows steps 1–3 for a `user` and steps 1–4 for an
      `admin`, in order.
- [ ] The topic accordion shows exactly the 3 shared topics for a `user` and
      all 8 topics for an `admin`; a `user` never sees an admin-only topic.
- [ ] Each topic's icon matches the icon already used for that capability's
      nav destination.
- [ ] No screenshots, illustrations, or new image assets are introduced.
- [ ] All new strings exist in both `uk` and `en`; the locale-parity test
      passes.
- [ ] `npm run verify` passes.

## Milestones

1. **Navigation and routing** — add the `help` nav destination
   (`navigationDestinations.ts`) and the `/help` route (`router.tsx`) behind a
   minimal placeholder page.
2. **Content model** — `constants/helpContent.ts` with typed, role-tagged
   quick-start steps and topic sections; role-filtering logic mirroring
   `selectDestinations`.
3. **Content authoring** — write the plain-language `uk`/`en` copy for the
   intro, quick-start steps, and every topic section.
4. **UI assembly** — intro block, quick-start step list, and topic
   `Accordion`, each reusing existing shared MUI patterns and nav icons.
5. **Tests, docs, verification** — component tests for role filtering and nav
   position, locale-parity coverage, documentation update, `npm run verify`.

## Open questions (non-blocking)

- Whether to later add contextual "?" entry points on individual screens that
  deep-link into their matching Help topic. Deferred; does not block this
  specification and can be proposed as its own follow-up.

## References

- `docs/01-overview.md` — roles, capabilities, domain vocabulary.
- `docs/specifications/navigation-shell/SPEC.md` — established role-based
  navigation destination pattern this spec reuses.
- `src/shared/components/AppShell/constants/navigationDestinations.ts`,
  `src/shared/components/AppShell/utils/selectDestinations.ts` — existing
  role-filtering pattern for nav entries.
- `src/app/router.tsx` — route tree.
- `src/locales/{uk,en}/translation.json`,
  `src/locales/__tests__/localeParity.test.ts` — i18n resources and parity
  gate.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-12 | Draft |
| Approver | User | 2026-07-12 | Approved |
