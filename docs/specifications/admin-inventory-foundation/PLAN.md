# Implementation Plan: Admin Inventory Foundation

| Field | Value |
| --- | --- |
| **Slug** | `admin-inventory-foundation` |
| **Status** | Approved |
| **Spec** | [SPEC.md](./SPEC.md) |
| **Created** | 2026-07-09 |

> **For agentic workers:** Use `test-driven-development` for every
> behavior-bearing task and `executing-plans` for sequential integration.
> Frontend tasks must apply `frontend-architecture` and
> `react-best-practices`. Home Menu rules override generic commit steps: do
> not stage, commit, push, or open a pull request without separate explicit
> user authorization.

## Goal

Scaffold the executable React TypeScript Vite SPA and deliver the first real
administrator workflow: Google Sign-In with admin-gated routes, ingredient
inventory management with quantity and presence tracking, transactional
append-only inventory movements, an inventory history route, Firestore
Security Rules, and `uk`/`en` internationalization, all proven by tests.

## Architecture

Follow `docs/02-architecture.md` layer boundaries exactly. The SPA lives under
`src/` with `app` (composition, router, theme, providers), `domain/inventory`
(pure TypeScript: no React, Firebase, Material UI, or i18next imports),
`features/auth` and `features/admin-inventory` (pages, components, hooks),
`infrastructure/firebase` (initialization, converters, services,
transactions), `locales/{uk,en}/translation.json`, and `shared`. Presentation
never issues raw Firestore queries; feature hooks call typed infrastructure
services; every stock or presence mutation runs in a single
`runTransaction` that updates the ingredient and appends its movement. Route
guards are a UX boundary only; Firestore Security Rules are the authorization
boundary.

## Global constraints

- Follow the approved [SPEC.md](./SPEC.md); it is immutable during
  implementation. A material departure requires a new linked SPEC.
- Do not stage, commit, push, or open a pull request without separate
  explicit user authorization.
- Never add real credentials, Firebase project IDs, UIDs, emails, service
  account files, or household data to tracked files. Use `<placeholders>` and
  `.test` identities in docs, tests, and fixtures.
- All developer-facing artifacts (code, comments, tests, docs) are English.
- Every user-facing string is defined in both `uk` and `en` translation
  resources; `uk` is default, `en` is fallback; no literal UI strings in TSX.
- `src/domain/**` stays pure TypeScript with no React, Firebase, Material UI,
  or i18next imports.
- npm is the package manager; `package-lock.json` is committed; Node is
  pinned in `.nvmrc`.
- No Cloud Functions, Storage, paid services, offline writes, or runtime
  auth bypasses.

## Scope and inherited non-goals

In scope: application scaffold and libraries, base routes and guards, Google
Sign-In, admin profile loading, ingredient CRUD with archive/restore,
quantity and presence mutations with `restock` and `correction` movements,
inventory history with ingredient filter, Firestore Rules and indexes,
`uk`/`en` i18n, and the documented test layers.

Inherited non-goals (from SPEC): user menu, orders, reservations, cooking
requests, dish/recipe management, affected-dish indicators, prepared batches,
`cooking` and `archive_adjustment` movement creation, desktop table layout,
real credentials, runtime auth bypasses, backend runtime services, and
automated data migration. Additionally deferred by user priority: all
regular-user features (admin-only slice) and Playwright end-to-end tests,
which follow after this first vertical slice per
`docs/07-testing-and-cicd.md`.

## Deep impact analysis

| Area | Required planning detail |
| --- | --- |
| Architecture | New `src/` tree with `app`, `domain/inventory`, `features/auth`, `features/admin-inventory`, `infrastructure/firebase`, `locales`, `shared`, `main.tsx`. Features import domain, infrastructure, and shared; domain imports nothing framework-specific. Public feature APIs are pages, guards, and hooks; converters and services are the only Firestore surface. |
| Data/domain | `Ingredient` and `InventoryMovement` shapes exactly as in `docs/03-data-model.md`. Invariants: quantity mode requires `baseUnit` in `gram\|milliliter\|piece`, `quantity >= 0`, `isPresent == null`, `lowStockThreshold == null \|\| >= 0`; presence mode requires `baseUnit == "presence"`, `quantity == null`, non-null `isPresent`, `lowStockThreshold == null`. Canonical units: g/kg -> gram, ml/l -> milliliter, pieces -> piece. Time is Firestore `Timestamp`. Concurrency via `runTransaction` re-read/validate/write. |
| Firebase | App init from `VITE_FIREBASE_*` env vars in ignored `.env.local`. Typed converters for `users`, `ingredients`, `inventoryMovements`. Queries: active/archived ingredients by `archivedAt`, movements ordered `createdAt DESC` with optional `ingredientId` filter. Composite index `inventoryMovements: ingredientId ASC, createdAt DESC` in `firestore.indexes.json`. Rules: deny by default, active-admin-only inventory writes, append-only movements, no client user creation or role change. Emulator Rules tests via `@firebase/rules-unit-testing`. |
| Migration | No deployed app or data exists; the schema is additive and matches current docs, so no backfill or compatibility window. Rollback before merge is a code revert; the data model stays compatible with the documented MVP. |
| Privacy/i18n | `.gitignore` already excludes `.env*`, keys, and emulator artifacts; verify nothing tracked leaks project IDs, UIDs, or emails. Tests use `admin@example.test`-style identities and `test-*-uid` values. Matching `uk` and `en` key sets enforced by a parity test; enum values stay language-neutral; user-entered names/notes untranslated; no secrets in runtime logs. |
| UX | Routes `/#/login`, `/#/admin`, `/#/admin/inventory`, `/#/admin/inventory/history` behind `RequireAuth` and `RequireAdmin`. Mobile-first Material UI cards/lists, active/archived tabs, loading/error/empty/ready states, accessible dialogs with focus management and duplicate-submit prevention, low-stock indicator not relying on color alone, localized denied-access states. |
| Quality | TDD for domain, guards, transactions, and Rules; structural checks for scaffold/config tasks. npm scripts `dev`, `build`, `format:check`, `lint`, `typecheck`, `test`, `test:rules`. Locale parity test, component tests for primary states, Rules emulator tests. README and docs updated with actual commands. |

## Conflict resolution

- `docs/07-testing-and-cicd.md` lists Playwright: per SPEC milestones and the
  documented "after the first vertical slice" rule, Playwright is explicitly
  deferred; no Playwright dependency is installed in this slice.
- The docs route list includes menu/orders/settings routes: only the four
  SPEC routes are implemented; other destinations may appear only as
  disabled or navigation-only entries and must not imply implementation.
- `archive_adjustment` exists in the domain vocabulary: it stays in the
  `MovementType` union but no code path creates it in this slice.
- Java 21+ is required for the Firebase Emulator Suite: it is documented as
  a prerequisite in README; the plan does not install system software.
- No other conflicts found.

## Affected files

### Create

- `.nvmrc`
- `package.json`, `package-lock.json`
- `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
- `.prettierrc.json`, `.prettierignore`, `eslint.config.js`
- `vitest.config.ts`, `vitest.rules.config.ts`, `src/test/setup.ts`
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- `src/main.tsx`
- `src/app/App.tsx`, `src/app/router.tsx`, `src/app/theme.ts`
- `src/app/providers/AppProviders.tsx`
- `src/app/i18n.ts`
- `src/locales/uk/translation.json`, `src/locales/en/translation.json`
- `src/infrastructure/firebase/firebaseApp.ts`
- `src/infrastructure/firebase/authAdapter.ts`
- `src/infrastructure/firebase/converters/userConverter.ts`
- `src/infrastructure/firebase/converters/ingredientConverter.ts`
- `src/infrastructure/firebase/converters/inventoryMovementConverter.ts`
- `src/infrastructure/firebase/services/userService.ts`
- `src/infrastructure/firebase/services/ingredientService.ts`
- `src/infrastructure/firebase/services/inventoryMovementService.ts`
- `src/infrastructure/firebase/services/inventoryTransactions.ts`
- `src/features/auth/AuthContext.tsx`, `src/features/auth/useAuth.ts`
- `src/features/auth/LoginPage.tsx`
- `src/features/auth/RequireAuth.tsx`, `src/features/auth/RequireAdmin.tsx`
- `src/features/admin-inventory/pages/AdminHomePage.tsx`
- `src/features/admin-inventory/pages/InventoryPage.tsx`
- `src/features/admin-inventory/pages/InventoryHistoryPage.tsx`
- `src/features/admin-inventory/components/` (ingredient card, tabs, dialogs
  for create/edit, restock, correction, presence, archive confirmation,
  low-stock indicator, movement list item, ingredient filter)
- `src/features/admin-inventory/hooks/useIngredients.ts`
- `src/features/admin-inventory/hooks/useInventoryMovements.ts`
- `src/features/admin-inventory/hooks/useInventoryCommands.ts`
- `src/domain/inventory/types.ts`
- `src/domain/inventory/validateIngredient.ts`
- `src/domain/inventory/convertToBaseUnit.ts`
- `src/domain/inventory/isLowStock.ts`
- `src/domain/inventory/movementCommands.ts`
- `src/domain/inventory/__tests__/validateIngredient.test.ts`
- `src/domain/inventory/__tests__/convertToBaseUnit.test.ts`
- `src/domain/inventory/__tests__/isLowStock.test.ts`
- `src/domain/inventory/__tests__/movementCommands.test.ts`
- `src/locales/__tests__/localeParity.test.ts`
- `src/features/auth/__tests__/routeGuards.test.tsx`
- `src/features/admin-inventory/__tests__/InventoryPage.test.tsx`
- `src/features/admin-inventory/__tests__/InventoryHistoryPage.test.tsx`
- `src/infrastructure/firebase/__tests__/inventoryTransactions.test.ts`
- `tests/rules/firestore.rules.test.ts`

### Modify

- `README.md` (actual setup, env var names, commands)
- `docs/07-testing-and-cicd.md` (only if the realized script names or test
  layout differ from the documented expectation)
- `docs/specifications/README.md` after implementation verification

Component file names inside `src/features/admin-inventory/components/` are
finalized during Task 6 under the one-component-per-file rule; all other
paths above are exact.

## Task 1: Scaffold the Vite React TypeScript application

**Files:** `package.json`, `package-lock.json`, `index.html`,
`vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `.nvmrc`,
`src/main.tsx`, `src/app/App.tsx`

- [ ] Create `.nvmrc` pinning the current Node LTS major (e.g. `22`), and use
      that Node version for all subsequent commands.
- [ ] Scaffold with `npm create vite@latest . -- --template react-ts` in the
      repository root, then `npm install`; keep strict TypeScript defaults.
- [ ] Remove template demo assets (logos, demo CSS, counter component) and
      reduce `src/App.tsx` to a placeholder moved to `src/app/App.tsx`, imported
      by `src/main.tsx`.
- [ ] Install runtime dependencies:
      `npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom i18next react-i18next firebase`.
- [ ] Install dev dependencies:
      `npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @firebase/rules-unit-testing firebase-tools prettier eslint typescript-eslint eslint-plugin-react-hooks`.
      Do not install Playwright (deferred until after this slice).
- [ ] Confirm `package-lock.json` exists and is tracked; confirm `.gitignore`
      already excludes `node_modules/`, `dist/`, and `.env*` (it does; no edit
      expected).
- [ ] Run `npm run dev` and load `http://localhost:5173/` to confirm the
      placeholder renders; run `npm run build` to confirm a clean production
      build.

Expected evidence: `npm run build` exits 0; the dev server serves the
placeholder app; `git status` shows only intended new files and no `.env*` or
credential files.

## Task 2: Establish formatting, linting, and test harness scripts

**Files:** `.prettierrc.json`, `.prettierignore`, `eslint.config.js`,
`vitest.config.ts`, `vitest.rules.config.ts`, `src/test/setup.ts`,
`package.json`

- [ ] Add Prettier config and `.prettierignore` (ignore `dist`, `coverage`,
      `package-lock.json`).
- [ ] Configure flat ESLint config with `typescript-eslint` recommended rules
      and `eslint-plugin-react-hooks`; zero-warning policy.
- [ ] Configure `vitest.config.ts` with `jsdom` environment,
      `src/test/setup.ts` loading `@testing-library/jest-dom`, and exclusion of
      `tests/rules/**`.
- [ ] Configure `vitest.rules.config.ts` with `node` environment including
      only `tests/rules/**`.
- [ ] Define npm scripts exactly: `dev`, `build`, `format:check`
      (`prettier --check .`), `lint` (`eslint . --max-warnings 0`), `typecheck`
      (`tsc --noEmit`), `test` (`vitest run`), `test:rules`
      (`firebase emulators:exec --only firestore "vitest run --config vitest.rules.config.ts"`).
- [ ] Run `npm run format:check`, `npm run lint`, `npm run typecheck`, and
      `npm test` (zero tests is acceptable at this point only if Vitest is
      configured with `passWithNoTests: true`; otherwise add a trivial smoke
      test at `src/app/__tests__/App.test.tsx` asserting the app shell renders).

Expected evidence: all four commands exit 0 on a clean tree; the scripts
match the names documented in `README.md` and `docs/07-testing-and-cicd.md`.

## Task 3: Routes, theme, and i18n with locale parity (TDD)

**Files:** `src/app/router.tsx`, `src/app/theme.ts`, `src/app/i18n.ts`,
`src/app/providers/AppProviders.tsx`, `src/locales/uk/translation.json`,
`src/locales/en/translation.json`, `src/locales/__tests__/localeParity.test.ts`

- [ ] RED: write `src/locales/__tests__/localeParity.test.ts` asserting the
      flattened key sets of `uk` and `en` are identical (fails on missing or
      extra keys) and that i18next initializes with `lng` resolution defaulting
      to `uk` and `fallbackLng: 'en'`. Run
      `npm test -- src/locales/__tests__/localeParity.test.ts` and confirm it
      fails because the resources and `src/app/i18n.ts` do not exist.
- [ ] GREEN: create `src/app/i18n.ts` (supported `uk`/`en`, default `uk`,
      fallback `en`, `localStorage` persistence, single `translation`
      namespace) and seed both locale files with the shell keys (app title,
      navigation, loading/error/empty labels). Rerun the focused test; confirm
      it passes.
- [ ] Create `src/app/theme.ts` with a mobile-first Material UI theme and
      `src/app/providers/AppProviders.tsx` composing ThemeProvider,
      CssBaseline, i18n, and (later) AuthProvider.
- [ ] Create `src/app/router.tsx` using `HashRouter` with routes `/login`,
      `/admin`, `/admin/inventory`, `/admin/inventory/history` rendering
      placeholder page components; no other documented destinations unless
      rendered as clearly disabled navigation entries.
- [ ] Verify manually: `npm run dev`, open `/#/admin/inventory` and confirm
      the placeholder renders with Ukrainian strings by default.

Expected evidence: the locale parity test transitions RED to GREEN; all four
hash routes render; no user-facing literal strings appear in TSX.

## Task 4: Firebase initialization, auth, and route guards (TDD)

**Files:** `src/infrastructure/firebase/firebaseApp.ts`,
`src/infrastructure/firebase/authAdapter.ts`,
`src/infrastructure/firebase/converters/userConverter.ts`,
`src/infrastructure/firebase/services/userService.ts`,
`src/features/auth/AuthContext.tsx`, `src/features/auth/useAuth.ts`,
`src/features/auth/LoginPage.tsx`, `src/features/auth/RequireAuth.tsx`,
`src/features/auth/RequireAdmin.tsx`,
`src/features/auth/__tests__/routeGuards.test.tsx`

- [ ] Create `firebaseApp.ts` reading `VITE_FIREBASE_API_KEY`,
      `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and
      `VITE_FIREBASE_APP_ID` from `import.meta.env`, failing fast with a clear
      developer error when missing. No concrete values anywhere in tracked
      files; `.env.local` stays ignored.
- [ ] Create `authAdapter.ts` (Google provider sign-in/sign-out,
      `onAuthStateChanged` subscription) and `userService.ts` +
      `userConverter.ts` loading `users/{uid}` typed as `UserProfile` from
      `docs/03-data-model.md`. No runtime bypass or mock-admin mode.
- [ ] RED: write `src/features/auth/__tests__/routeGuards.test.tsx` with a
      mocked auth context covering: unauthenticated user on `/admin/inventory`
      is redirected to `/login`; authenticated but unprovisioned, inactive, or
      `role: 'user'` profiles see the localized access-denied state and cannot
      see inventory content; an active admin (`test-admin-uid`,
      `admin@example.test`) reaches the inventory placeholder. Run
      `npm test -- src/features/auth/__tests__/routeGuards.test.tsx`; confirm
      failure because the guards do not exist.
- [ ] GREEN: implement `AuthContext.tsx` (Auth user, loaded profile, role,
      loading state only), `RequireAuth.tsx`, `RequireAdmin.tsx`, and
      `LoginPage.tsx` with a Google Sign-In button and localized states. Wire
      the guards around `/admin/*` in `src/app/router.tsx`. Rerun the focused
      test; confirm it passes.
- [ ] Add all new strings to both locale files; rerun the locale parity test.
- [ ] Run `npm run typecheck && npm test`.

Expected evidence: route guard tests transition RED to GREEN for all four
denial cases plus the admin-allowed case; guards remain UX-only (no data
authorization logic in components).

## Task 5: Inventory domain model, validation, and conversion (TDD)

**Files:** `src/domain/inventory/types.ts`,
`src/domain/inventory/validateIngredient.ts`,
`src/domain/inventory/convertToBaseUnit.ts`,
`src/domain/inventory/isLowStock.ts`,
`src/domain/inventory/movementCommands.ts`, and their tests under
`src/domain/inventory/__tests__/`

- [ ] Create `types.ts` mirroring the SPEC `Ingredient`, `BaseUnit`,
      `MovementType`, and `InventoryMovement` shapes, using a domain-level
      timestamp abstraction so the module never imports Firebase.
- [ ] RED: `__tests__/convertToBaseUnit.test.ts` — kg to grams (1.5 kg ->
      1500), g passthrough, l to milliliters, ml passthrough, pieces
      passthrough, and rejection of `NaN`, `Infinity`, negatives, and invalid
      unit/mode combinations. Run
      `npm test -- src/domain/inventory/__tests__/convertToBaseUnit.test.ts`;
      confirm failure, then implement `convertToBaseUnit.ts` and confirm GREEN.
- [ ] RED: `__tests__/validateIngredient.test.ts` — every quantity and
      presence invariant from the SPEC, including `lowStockThreshold` optional
      for quantity and forbidden for presence. Confirm failure, implement
      `validateIngredient.ts` with stable error codes (e.g.
      `INVALID_QUANTITY`, `INVALID_TRACKING_MODE`), confirm GREEN.
- [ ] RED: `__tests__/isLowStock.test.ts` — true at and below threshold,
      false above, false when threshold is `null` or mode is presence. Confirm
      failure, implement `isLowStock.ts`, confirm GREEN.
- [ ] RED: `__tests__/movementCommands.test.ts` — command builders/validators
      for restock (positive delta or presence -> present), correction (exact
      balance with required non-empty reason, or presence -> absent), computing
      `deltaQuantity`, `balanceAfter`, `presenceBefore/After`, and rejecting
      invalid commands. Confirm failure, implement `movementCommands.ts`,
      confirm GREEN.
- [ ] Refactor while green; assert with
      `rg -n "from 'react'|from 'firebase|@mui|i18next" src/domain` that domain
      files import none of them (expect no matches).

Expected evidence: four focused test files each show a recorded RED then
GREEN run; the `rg` purity check returns no matches.

## Task 6: Firestore converters, services, Rules, and indexes (TDD)

**Files:** `src/infrastructure/firebase/converters/ingredientConverter.ts`,
`src/infrastructure/firebase/converters/inventoryMovementConverter.ts`,
`src/infrastructure/firebase/services/ingredientService.ts`,
`src/infrastructure/firebase/services/inventoryMovementService.ts`,
`firebase.json`, `firestore.rules`, `firestore.indexes.json`,
`tests/rules/firestore.rules.test.ts`

- [ ] Create typed converters and services: create/update ingredient (with
      domain validation re-checked before write), archive (`archivedAt` set) and
      restore (`archivedAt: null`, `updatedAt`/`updatedBy` refreshed, no
      movement), active/archived queries, and movements query ordered
      `createdAt DESC` with optional `ingredientId` filter.
- [ ] Create `firebase.json` (Firestore emulator, rules and indexes paths)
      and `firestore.indexes.json` containing the composite index
      `inventoryMovements: ingredientId ASC, createdAt DESC`.
- [ ] RED: write `tests/rules/firestore.rules.test.ts` using
      `@firebase/rules-unit-testing` with synthetic identities
      (`test-admin-uid`, `test-user-uid`, `test-inactive-uid`,
      `admin@example.test`) covering: unauthenticated denial everywhere;
      unprovisioned and inactive denial; non-admin user denied ingredient and
      movement writes; client cannot create `users/{uid}` or change `role`;
      active admin can create/update/archive/restore ingredients and create
      movements; movement update and delete denied even for admins; ingredient
      delete denied. Run `npm run test:rules` (requires Java 21+ for the
      emulator) and confirm the expected failures against empty rules.
- [ ] GREEN: write `firestore.rules` with deny-by-default, `isAdmin()`-style
      helpers per `docs/06-auth-and-security.md`, field allowlists and enum
      validation for ingredients and movements, append-only movements, and no
      physical deletes. Rerun `npm run test:rules`; confirm all pass.
- [ ] Run `npm run typecheck && npm test`.

Expected evidence: `npm run test:rules` transitions from expected denials
failing to the full matrix passing; `firestore.indexes.json` contains exactly
the documented composite index.

## Task 7: Inventory page with create, edit, archive, restore (TDD)

**Files:** `src/features/admin-inventory/pages/AdminHomePage.tsx`,
`src/features/admin-inventory/pages/InventoryPage.tsx`,
`src/features/admin-inventory/components/` (one component per file),
`src/features/admin-inventory/hooks/useIngredients.ts`,
`src/features/admin-inventory/__tests__/InventoryPage.test.tsx`, both locale
files

- [ ] RED: write `InventoryPage.test.tsx` with mocked services covering:
      loading, error, empty, and ready states; active/archived tabs; create
      dialog producing a quantity ingredient from `kg` input persisted as
      canonical grams via `convertToBaseUnit`; create dialog for a presence
      ingredient hiding quantity and low-stock fields; client-side rejection of
      negative and non-numeric quantity input; edit dialog; archive with
      confirmation moving the ingredient to the archived tab without any
      movement service call; restore returning it to active; low-stock
      indicator shown when `quantity <= lowStockThreshold` with an accessible
      non-color-only label; duplicate-submit prevention on dialogs. Run
      `npm test -- src/features/admin-inventory/__tests__/InventoryPage.test.tsx`
      and confirm failure.
- [ ] GREEN: implement `useIngredients.ts` (typed `onSnapshot` subscription
      with unmount cleanup), the mobile-first card/list components, tabs,
      dialogs with accessible names, focus management, keyboard submission, and
      cancellation, plus `AdminHomePage.tsx` as a minimal admin shell linking
      to inventory. Rerun the focused test; confirm GREEN.
- [ ] Add every new label, validation message, dialog text, empty state, and
      icon accessible name to both `uk` and `en`; rerun the locale parity test.
- [ ] Run `npm run lint && npm run typecheck && npm test`.

Expected evidence: the component test file transitions RED to GREEN for all
listed states; archive/restore issue no movement writes; both locale files
grow by identical key sets.

## Task 8: Stock and presence mutation transactions (TDD)

**Files:** `src/infrastructure/firebase/services/inventoryTransactions.ts`,
`src/features/admin-inventory/hooks/useInventoryCommands.ts`, mutation
dialog components under `src/features/admin-inventory/components/`,
`src/infrastructure/firebase/__tests__/inventoryTransactions.test.ts`,
`src/features/admin-inventory/__tests__/InventoryPage.test.tsx` (extend),
both locale files

- [ ] RED: write `inventoryTransactions.test.ts` against the Firestore
      emulator (or a typed transaction fake where the emulator is
      disproportionate) asserting: restock of a quantity ingredient increases
      `quantity` and creates one `restock` movement with correct
      `deltaQuantity`, `balanceAfter`, `ingredientName` snapshot, `createdBy`;
      correction sets the exact balance with a required reason stored in
      `note` and type `correction`; mark-present creates a `restock` movement
      with `presenceBefore/After`; mark-absent creates a `correction` movement;
      a validation failure inside the transaction writes neither document; both
      writes always occur in one `runTransaction`. Run the focused test and
      confirm failure.
- [ ] GREEN: implement `inventoryTransactions.ts` — each command re-reads the
      ingredient in the transaction, re-validates domain invariants via
      `src/domain/inventory/movementCommands.ts`, then writes the updated
      ingredient and the new movement document together. Rerun; confirm GREEN.
- [ ] Implement `useInventoryCommands.ts` mapping domain error codes to
      translation keys, and the restock, correction (with required reason
      field), mark-present, and mark-absent dialogs; extend
      `InventoryPage.test.tsx` (RED first) to cover action availability by
      tracking mode and reason-required validation, then make it GREEN.
- [ ] Add new strings to both locales; rerun parity test.
- [ ] Run `npm run typecheck && npm test && npm run test:rules`.

Expected evidence: transaction tests show atomic ingredient+movement writes
and no partial writes on failure; UI tests show correction blocked without a
reason and presence actions only on presence ingredients.

## Task 9: Inventory history route with ingredient filter (TDD)

**Files:** `src/features/admin-inventory/pages/InventoryHistoryPage.tsx`,
`src/features/admin-inventory/hooks/useInventoryMovements.ts`, movement list
and filter components,
`src/features/admin-inventory/__tests__/InventoryHistoryPage.test.tsx`, both
locale files

- [ ] RED: write `InventoryHistoryPage.test.tsx` covering: loading, error,
      empty, and ready states; entries showing ingredient name snapshot,
      localized movement type label, delta or presence transition, balance
      after, note when present, and creation time; ingredient filter narrowing
      the list; preselection of the filter from an
      `?ingredientId=<id>` query/search param used by per-ingredient history
      links on the inventory page. Run
      `npm test -- src/features/admin-inventory/__tests__/InventoryHistoryPage.test.tsx`
      and confirm failure.
- [ ] GREEN: implement `useInventoryMovements.ts` (query ordered
      `createdAt DESC`, optional `ingredientId` filter matching the composite
      index) and the page/components; add the history navigation action to each
      ingredient card on the inventory page. Rerun; confirm GREEN.
- [ ] Add strings to both locales; rerun parity test.
- [ ] Manually verify against the emulator: restock an ingredient, open
      `/#/admin/inventory/history`, filter by that ingredient, and confirm the
      movement renders.

Expected evidence: history tests transition RED to GREEN; the filtered query
shape matches the `ingredientId ASC, createdAt DESC` composite index.

## Task 10: Documentation, integrated verification, and privacy gate

**Files:** `README.md`, `docs/07-testing-and-cicd.md` (only if realized
commands differ), `docs/specifications/README.md` (after verification)

- [ ] Update `README.md`: replace the "not scaffolded yet" status, document
      actual setup (`.nvmrc` Node version, `npm ci`, `npm run dev`, Java 21+
      prerequisite for emulator Rules tests), the `VITE_FIREBASE_*` variable
      names in ignored `.env.local` with placeholder values only, and the
      verified command list.
- [ ] Run the full suite and record results:
      `npm run format:check && npm run lint && npm run typecheck && npm test && npm run test:rules && npm run build`.
- [ ] Walk each SPEC acceptance criterion against the mapping table below
      and record the verifying test or command for each.
- [ ] Privacy gate: inspect `git status --short` and the full diff; run the
      leak scan from Verification commands; confirm no `.env*`, key, emulator
      export, real email, UID, or project ID is tracked; confirm fixtures use
      `.test` identities.
- [ ] Confirm approved SPEC and this PLAN were not modified during
      implementation.
- [ ] Update `docs/specifications/README.md` index entry to `Implemented`
      and link this PLAN.
- [ ] Report every verification command run and anything not run. Do not
      stage or commit; stop and hand the working tree to the user.

Expected evidence: all six commands exit 0; the leak scan output is reviewed
with no findings; the index row reads `Implemented`.

## Acceptance-criteria mapping

| SPEC criterion | Plan task | Verification |
| --- | --- | --- |
| Executable React TS Vite SPA with locked core libraries | Tasks 1–2 | `npm ci && npm run build`; `package-lock.json` tracked |
| `/#/login` Google Sign-In via Firebase Auth | Task 4 | Guard tests; manual emulator/dev sign-in check |
| Admin routes blocked for unauthenticated/unprovisioned/inactive/non-admin | Task 4 | `routeGuards.test.tsx` denial cases |
| Provisioned active admin reaches `/#/admin/inventory` | Task 4 | `routeGuards.test.tsx` admin case |
| Create quantity ingredients with canonical units from g/kg, ml/l, pieces | Tasks 5, 7 | `convertToBaseUnit.test.ts`; `InventoryPage.test.tsx` |
| Create presence ingredients without quantity/low-stock fields | Tasks 5, 7 | `validateIngredient.test.ts`; `InventoryPage.test.tsx` |
| Restock writes balance + append-only `restock` movement in one transaction | Task 8 | `inventoryTransactions.test.ts` |
| Correction writes exact balance + `correction` movement with required reason | Task 8 | `inventoryTransactions.test.ts`; `InventoryPage.test.tsx` |
| Presence actions create matching movements in the same transaction | Task 8 | `inventoryTransactions.test.ts` |
| Archive with non-zero stock or `isPresent == true`, no movement | Task 7 | `InventoryPage.test.tsx` archive cases |
| Archived tab and restore | Task 7 | `InventoryPage.test.tsx` tab/restore cases |
| History route displays movements and filters by ingredient | Task 9 | `InventoryHistoryPage.test.tsx` |
| Matching `uk`/`en` strings, `uk` default, `en` fallback | Tasks 3–9 | `localeParity.test.ts` |
| Rules deny unauthorized access; only active admins mutate inventory | Task 6 | `npm run test:rules` matrix |
| Test coverage across domain, conversion, parity, routing, Rules, transactions | Tasks 3–9 | `npm test && npm run test:rules` |
| README/docs updated with setup, env var names, commands | Task 10 | README diff review; commands re-run from README |

## Documentation updates

`README.md` is the primary current-documentation change (Task 10).
`docs/02-architecture.md`, `docs/03-data-model.md`, and
`docs/06-auth-and-security.md` already describe the target state and need no
change unless implementation reveals a discrepancy; any such discrepancy is
recorded in current docs, never in this frozen PLAN or the SPEC.

## Rollout and rollback

There is no deployed application, CI pipeline consumer, or existing data.
Rollout is merging the reviewed working tree after user authorization; CI and
GitHub Pages deployment remain future work outside this SPEC. Rollback before
merge is discarding or reverting the working tree. The Firestore schema is
additive and matches the documented model, so no data rollback is required;
`firestore.rules` and `firestore.indexes.json` are versioned with the code
and roll back with it.

## Verification commands

```bash
node --version   # must match .nvmrc
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:rules   # requires Java 21+ for the Firestore emulator
npm run build
```

Privacy and purity inspection:

```bash
git status --short
git diff
rg -n "from 'react'|from 'firebase|@mui|i18next" src/domain
rg -n \
  '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AIza[0-9A-Za-z_-]{35}|firebaseapp\.com|[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com|gh[pousr]_[0-9A-Za-z]{20,}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|/Users/[^/[:space:]]+|/home/[^/[:space:]]+)' \
  src tests firestore.rules firestore.indexes.json README.md package.json
```

Review every match manually; `.test` fixture identities are the only
acceptable email-shaped matches. Real names, UIDs, project IDs, and household
data require full-diff review because regexes alone give false confidence.

## Risks

- Firestore Rules field validation is verbose and easy to get subtly wrong.
  Mitigate with the deny-by-default matrix test written RED-first in Task 6.
- Emulator-dependent tests (`test:rules`, transaction tests) require Java
  21+; document the prerequisite in README and report clearly if the
  emulator cannot start rather than silently skipping.
- Mocked-service component tests can drift from real service signatures.
  Mitigate by importing the real service types into test doubles and running
  `typecheck` in every task.
- Scope creep toward dishes, batches, or user features is tempting once the
  shell exists. The SPEC non-goals govern; disabled navigation entries must
  not imply unimplemented features.
- MUI dialog focus management and duplicate-submit prevention are easy to
  regress; both are pinned by explicit assertions in Task 7 tests.

## Non-blocking open questions

- Exact visual density, icons, and card layout of the mobile inventory list
  are finalized during Task 7 within the SPEC's functional requirements.
- Date and movement-type filters on the history route are added in Task 9
  only if trivially cheap; the ingredient filter alone satisfies acceptance.
- Whether Task 8 transaction tests run against the emulator or a typed
  transaction fake is decided in Task 8 based on runtime cost; the Rules
  matrix always runs against the emulator.

## Approval

| Role | Status |
| --- | --- |
| User | Approved on 2026-07-09 |
| Engineering agent | Ready for review |
