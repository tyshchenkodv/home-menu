# Admin inventory design retrofit plan

| Field | Value |
| --- | --- |
| Slug | `admin-inventory-design-retrofit` |
| Status | Approved |
| Specification | [SPEC.md](./SPEC.md) (Approved 2026-07-10) |
| Created | 2026-07-10 |

## Goal

Align the existing admin-inventory screens with the design: a clean
`IngredientCard` with a `StatusChip` and a kebab action menu, a FAB for adding,
`CatArt` state beats, and a day-grouped history with colored deltas — plus a
faithful `CatArt` upgrade and reusable shared primitives.

## Architecture and stack

- React + TS + MUI v9, react-i18next, Vitest + RTL + userEvent.
- Shared, feature-agnostic UI (`StatusChip`, `StatePlaceholder`, upgraded
  `CatArt`) lives under `src/shared/components/<Component>/` (one component per
  folder, `sx` in a sibling styles file). Feature-specific presentation and the
  ingredient→status mapping stay in `features/admin-inventory`.
- Presentation only: no `domain`, `infrastructure`, hooks, or Firestore change.
  `isLowStock` and `formatIngredientQuantity` are reused unchanged.

## Global constraints

- Named exports only; TypeScript strict clean; `lint` max-warnings 0.
- All user-facing text via i18next with matching `uk`/`en` keys (`uk` default).
- Never copy synthetic sample data (names, dishes) from the design sources into
  code, tests, or docs.
- No staging/committing/pushing during implementation.

## Scope

In: `CatArt` upgrade + `AppHeader` migration; shared `StatusChip` and
`StatePlaceholder`; `IngredientCard`, `InventoryPage`, `InventoryHistoryPage`,
`MovementList`/`MovementListItem` retrofit; removal of the now-superseded
`LowStockChip`.

Inherited non-goals (SPEC): no new/unbuilt screens, no navigation shell, no
domain/data/Firestore change, no change to which actions exist.

## Impact analysis

| Area | Detail |
| --- | --- |
| Architecture | Adds `src/shared/components/{StatusChip,StatePlaceholder}/`; upgrades `src/shared/components/CatArt/`; migrates `AppHeader`; edits `IngredientCard`, `InventoryPage`, `InventoryHistoryPage`, `MovementList`, `MovementListItem`; removes `IngredientCard/components/LowStockChip/` and `types/lowStockChipProps.ts`. Adds a feature util `utils/ingredientStatus.ts`. Shared components depend only on MUI/theme/i18n. |
| Data/domain | None. `isLowStock`, `formatIngredientQuantity`, movement shapes unchanged. Status mapping is pure presentation. |
| Firebase | None. |
| Migration | Presentation-only, additive. `CatArt` variant rename `content`→`idle` is a breaking change to its single consumer (`AppHeader`), updated in the same slice. Rollback reverts UI only. |
| Privacy/i18n | New keys under `inventory.status`, `inventory.actions`, `inventory.history.day`; added to both locales; parity enforced. No sample data leaks. |
| UX | Cleaner card + kebab menu; FAB; mascot state beats; grouped history with colored deltas. Admin-only routes and guards unchanged. |
| Quality | New tests for `StatusChip`, `StatePlaceholder`, `ingredientStatus`, retrofitted `IngredientCard`, upgraded `CatArt`; update `InventoryPage`/`InventoryHistoryPage` tests; locale parity; full `test`/`lint`/`typecheck`/`build`; visual proof of both screens (light/dark × uk/en). |

## Conflicts investigated

- **CatArt rename breaks AppHeader** — resolved inside Task 1 (same slice
  updates the only consumer and its test).
- **LowStockChip removal** — `IngredientCard` is its only user; removed together
  with its props type in Task 3. `lowStock.label` i18n key is retained (reused
  by `StatusChip` warning state).
- **Existing page tests assert current markup** — `InventoryPage` and
  `InventoryHistoryPage` tests query action buttons/labels that move into a
  menu and change to a FAB; those tests are updated in the same tasks (3/4/5),
  not left to drift.
- **MovementListItem already signs deltas** (`Intl` `signDisplay: 'exceptZero'`)
  — Task 5 adds only day grouping and delta color, not new formatting logic.

No blocking conflicts found.

## New i18n keys (both locales)

- `inventory.status.inStock` = "In stock" / "У наявності"
- `inventory.status.out` = "Out" / "Немає"
- (`inventory.lowStock.label` reused for the warning state)
- `inventory.actions.moreFor` = "More actions for \"{{name}}\"" (kebab aria-label)
- `inventory.history.day.today` / `inventory.history.day.yesterday`
  (older days use `Intl.DateTimeFormat` date style, no key)

## Tasks

### Task 1 — CatArt upgrade + AppHeader migration

Depends on: none.

- [ ] Transcribe faithful multi-color SVGs from
      `design/home-menu-kitchen-inventory-app/CatArt.dc.html` for variants
      `idle`, `empty`, `sleeping`, `confused`, and `logo`.
- [ ] Update the failing-first test: extend
      `src/shared/components/CatArt/__tests__/CatArt.test.tsx` to the new variant
      union (assert each renders an `<svg>`, `size` maps to width/height, and
      accessibility: titled → `role="img"` with name, untitled → `aria-hidden`).
      Run RED (`npm run test -- src/shared/components/CatArt`).
- [ ] Change `CatArt` `variant` prop union to
      `'idle' | 'empty' | 'sleeping' | 'confused' | 'logo'`; implement the SVGs.
- [ ] Update `AppHeader` to use `<CatArt variant="logo" size={32} />` and its
      test accordingly.
- [ ] GREEN focused tests; `npm run test`, `typecheck`, `lint` clean.

Deliverable: faithful `CatArt` and migrated header.

### Task 2 — StatusChip primitive + ingredient status mapping

Depends on: none (parallelizable with Task 1).

- [ ] Add `src/shared/components/StatusChip/StatusChip.tsx` — named export;
      props `{ label: string; color: 'success' | 'warning' | 'default' }`; MUI
      `Chip` (size small, pill) with the semantic color. Test: renders label and
      applies color.
- [ ] Add `src/features/admin-inventory/utils/ingredientStatus.ts` — pure
      function `getIngredientStatus(ingredient): { labelKey: string; color }`
      per the SPEC mapping (quantity >0 & not low → `status.inStock`/success;
      low via `isLowStock` → `lowStock.label`/warning; quantity 0 →
      `status.out`/default; presence present → inStock/success; absent →
      out/default). Unit-test the mapping (RED first).
- [ ] Add the `inventory.status.*` keys (done centrally before this task; see
      "i18n keys").
- [ ] GREEN; `typecheck`/`lint` clean.

Deliverable: reusable `StatusChip` + tested mapping.

### Task 3 — IngredientCard retrofit (chip + kebab menu)

Depends on: Task 2.

- [ ] Update the card test first (RED): assert a `StatusChip` with the mapped
      label renders; assert a single "more actions" trigger (`aria-label` from
      `inventory.actions.moreFor`) opens a menu exposing edit / restock /
      correct / mark-present / mark-absent / archive / restore / history items
      (per tracking mode and tab), each with its existing localized name and
      callback.
- [ ] Replace the inline `IconButton` row with a `StatusChip` +
      an overflow `IconButton` (`MoreVertIcon`) controlling a MUI `Menu`; wire
      each `MenuItem` to the existing `IngredientCardProps` callbacks; keep
      history as a `RouterLink` menu item.
- [ ] Remove `IngredientCard/components/LowStockChip/` and
      `types/lowStockChipProps.ts`; drop the `isLowStock` inline chip usage
      (now inside `getIngredientStatus`).
- [ ] GREEN focused test; `typecheck`/`lint` clean.

Deliverable: clean card matching the design, actions in a menu.

### Task 4 — InventoryPage FAB + CatArt state beats

Depends on: Task 1.

- [ ] Add `src/shared/components/StatePlaceholder/StatePlaceholder.tsx` — named
      export; props `{ variant: 'sleeping' | 'empty' | 'confused'; message:
      string }`; renders the `CatArt` variant + message. Test it (RED first).
- [ ] Refactor `EmptyState`, `ErrorState`, `LoadingState` to render
      `StatePlaceholder` with the right variant (empty→`empty`, error→
      `confused`, loading→`sleeping`), preserving their existing `message`
      prop and public shape so `InventoryPage` wiring is unchanged.
- [ ] Update `InventoryPage`: replace the top "create" `Button` with a MUI
      `Fab` (bottom-right, `color="primary"`, `aria-label` from
      `inventory.actions.create`) triggering the same create dialog.
- [ ] Update `InventoryPage.test.tsx`: the add affordance is now the FAB (query
      by its accessible name); loading/empty/error render the placeholder with
      a mascot (`<svg>` present) and the localized message.
- [ ] GREEN; full `npm run test` for the feature; `typecheck`/`lint` clean.

Deliverable: FAB + mascot-driven states; reusable `StatePlaceholder`.

### Task 5 — History grouping + colored deltas

Depends on: none functionally, but sequence after Task 4 to avoid test churn.

- [ ] Update `InventoryHistoryPage.test.tsx` first (RED): movements render under
      day-group headers (today/yesterday/date) and a decrease vs increase delta
      is visually distinguished (assert on the applied color/role or a testable
      class/style hook).
- [ ] In `MovementList`, group movements by calendar day from
      `movement.createdAt.toMillis()` and render a localized day header per
      group (`inventory.history.day.today`/`yesterday`, else
      `Intl.DateTimeFormat` date). Keep the existing filter and read-only flow.
- [ ] In `MovementListItem`, color the signed delta (increase → `success.main`,
      decrease → `text.secondary`/muted); keep the existing `signDisplay`
      formatting and presence-transition text.
- [ ] GREEN; `typecheck`/`lint` clean.

Deliverable: grouped, color-coded history.

### Task 6 — Verification and documentation

Depends on: Tasks 1–5.

- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all
      pass.
- [ ] Visual proof via preview: the inventory screen (card + chip + FAB +
      an empty/error/loading state) and the history screen, each in light and
      dark and in `uk` and `en`.
- [ ] Update `docs/design/README.md` (CatArt variant set → `idle/empty/
      sleeping/confused/logo`; status-chip mapping note) and
      `docs/05-components-and-flows.md` (StatusChip, StatePlaceholder, kebab
      menu, FAB, grouped history).
- [ ] Mark the specifications index entry `Implemented`.

Deliverable: verified slice with visual proof and updated docs.

## Acceptance-criteria mapping

| SPEC criterion | Task(s) | Verification |
| --- | --- | --- |
| Card: name + qty + StatusChip + kebab menu | 2,3 | `IngredientCard` test + visual |
| FAB replaces top button | 4 | `InventoryPage` test + visual |
| Shared StatusChip + mapping | 2 | `StatusChip` + `ingredientStatus` tests |
| CatArt state beats (sleep/empty/confused) | 1,4 | `StatePlaceholder` + `InventoryPage` tests + visual |
| Faithful CatArt variants + header logo | 1 | `CatArt` + `AppHeader` tests + visual |
| History day-grouping + colored deltas | 5 | `InventoryHistoryPage` test + visual |
| i18n keys + parity | 2,3,5 | `localeParity.test.ts` |
| Full suite + visual proof | 6 | `npm run test`/`build` + preview screenshots |

## Documentation, rollout, rollback

- Docs: update `docs/design/README.md` and `docs/05-components-and-flows.md`;
  mark index `Implemented`.
- Rollout: presentation-only; additive; no data or contract change.
- Rollback: revert the slice; no migration.

## Risks

- **Existing page tests** encode the old markup — mitigated by updating them
  inside the same task that changes the markup (Tasks 3/4/5).
- **CatArt SVG transcription fidelity** — mitigated by transcribing directly
  from `CatArt.dc.html` and confirming via visual proof in Task 6.
- **FAB overlap with content** on small viewports — verify in Task 6; use
  standard MUI FAB placement and bottom padding on the list.

## Non-blocking open questions

- Day-group threshold semantics (relative today/yesterday vs absolute date) —
  resolve with the existing locale date formatting during Task 5.
- Whether decorative `paw`/`whisker` motifs are ported — default no.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-10 | Submitted for review |
| Approver | Dmytro Tyshchenko | 2026-07-10 | Approved |
