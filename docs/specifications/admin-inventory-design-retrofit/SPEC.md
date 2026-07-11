# Admin inventory design retrofit specification

| Field | Value |
| --- | --- |
| Slug | `admin-inventory-design-retrofit` |
| Status | Approved |
| Request | Align the existing admin-inventory screens with the design system and extract reusable design primitives |
| Created | 2026-07-10 |
| Related artifacts | Builds on [design-system-foundation](../design-system-foundation/SPEC.md); design canon `docs/design/README.md`; visual/source references under `design/` |

## Problem statement

The `design-system-foundation` slice wired the theme, fonts, brand header, and
`CatArt` globally, so the existing admin-inventory screens already inherit the
palette, typography, and dark mode. They do not yet match the design's specific
inventory screens: the `IngredientCard` shows a cluttered row of five-to-six
inline icon buttons instead of a clean card with a status chip; adding an
ingredient uses a top button rather than a floating action button; loading,
empty, and error states are plain text rather than the `CatArt` mascot beats;
and the inventory history is an ungrouped list without day grouping or signed
deltas.

Additionally, the shipped `CatArt` is a simplified single-color face with
variants `content`/`confused`/`sleeping`, whereas the authoritative design
source (`design/home-menu-kitchen-inventory-app/CatArt.dc.html`) defines a
richer multi-color illustration with variants `idle`, `empty`, `sleep`,
`confused`, and `logo` (plus decorative `paw`/`whisker`). Retrofitting the
state screens requires the faithful illustrations, so `CatArt` is upgraded here.

## Goals

1. Retrofit `IngredientCard` to the design: bold name, quantity/presence text,
   a `StatusChip`, and all per-item actions moved into a single overflow
   (kebab) menu.
2. Replace the top "add ingredient" button with a floating action button (FAB)
   bottom-right on the inventory screen.
3. Extract a reusable `StatusChip` shared component implementing the ingredient
   status mapping, replacing the current low-stock-only chip.
4. Present loading, empty, and error states with `CatArt` (loading = `sleep`,
   empty = `empty`, error = `confused`) plus localized copy, via a reusable
   async-state primitive.
5. Upgrade `CatArt` to the faithful multi-color illustrations transcribed from
   the design source, with variants `idle`, `empty`, `sleeping`, `confused`,
   and `logo`; migrate the header to `variant="logo"`.
6. Retrofit `InventoryHistoryPage` to group movements by day and show signed,
   color-coded deltas, keeping the existing ingredient filter and read-only
   behavior.
7. Verify through component tests, updated existing tests, locale parity, and
   visual proof in both schemes and locales.

## Non-goals

- Building any not-yet-existing screen (Batches, Cooking requests / Orders,
  Menu, Settings) — each needs its own specification, domain, and data model.
- Bottom navigation or any app-shell navigation (deferred to a future slice).
- Changing domain logic, inventory invariants, units, Firestore schema,
  converters, queries, indexes, Rules, or transactions.
- Changing what actions exist on an ingredient — only their presentation moves
  into the kebab menu.
- Pixel-perfect reproduction; the design canon and existing architecture win
  where they differ.

## Design source of truth

- `docs/design/README.md` — canonical tokens and status-chip semantics.
- `design/home-menu-kitchen-inventory-app/CatArt.dc.html` — authoritative
  `CatArt` SVG geometry and variant set.
- `design/home-menu-kitchen-inventory-app/Home Menu.offline-src.html` and
  `design/Home Menu.png` — readable/visual references for the inventory,
  correction, and history screens. These contain synthetic sample data; never
  copy sample names or values into code, tests, or docs.

## Workflow, domain, and data

No domain or data-model change. Presentation only.

### Ingredient status mapping (`StatusChip`)

| Ingredient state | Chip label | Color |
| --- | --- | --- |
| Quantity `> 0`, not low stock | In stock | `success` |
| Quantity `> 0`, at/below low-stock threshold | Low stock | `warning` |
| Quantity `= 0` | Out | `default` (grey) |
| Presence: present | In stock | `success` |
| Presence: absent | Out | `default` (grey) |

Low-stock detection reuses the existing `isLowStock` domain function; the chip
is presentation only. `StatusChip` is generic (label + semantic color) and
lives in `shared/components/` so future screens can reuse it.

### Per-item actions (kebab menu)

The overflow menu contains the current actions unchanged in behavior: edit,
restock (quantity), correct (quantity), mark present / mark absent (presence),
archive / restore, and open history. Menu items are keyboard accessible with
localized labels and per-item accessible names.

### History presentation

Movements are grouped under day headers (e.g. Today / Yesterday / explicit
date), each row showing the movement type, optional note, a signed delta
colored by direction (increase = `success`, decrease = muted/secondary), and a
localized timestamp. Filter and read-only semantics are unchanged.

## UX and accessibility

- Roles: unchanged — these are administrator-only routes behind the existing
  `RequireAuth` + `RequireAdmin` guards.
- The FAB has a localized accessible name; the kebab trigger has a per-item
  accessible name; menu and dialog focus behavior follow MUI defaults.
- Loading, empty, and error states are explicit and each pair a `CatArt` beat
  with localized copy; the mascot is decorative and not a sole information
  carrier.
- All labels, chip text, day-group headers, and delta formatting come from
  i18next with matching `uk`/`en` keys.

## Impact analysis

| Area | Assessment |
| --- | --- |
| Architecture | Modifies `features/admin-inventory` components (`IngredientCard`, `InventoryPage`, `InventoryHistoryPage`, movement list, existing Loading/Empty/Error states) and `src/shared/components/CatArt`. Adds shared `StatusChip` and a reusable async-state/empty primitive under `shared/components/`. Migrates `AppHeader` to `CatArt variant="logo"`. No `domain`/`infrastructure` change. |
| Firebase | None. Not applicable. |
| Domain | No invariant, unit, status enum, or transaction change; `isLowStock` reused as-is. |
| Privacy | Design source files contain synthetic sample data; it must not leak into code/tests/docs. No real data introduced. Public-repo safe. |
| i18n | New keys for status labels, day-group headers, delta/quantity formatting, FAB and menu accessible names, and state copy — added to both `uk` and `en`; parity enforced by `localeParity.test.ts`. `uk` default, `en` fallback. |
| UX | Cleaner card, FAB, mascot state beats, grouped history. No route or permission change. No destructive-action semantics change. |
| Compatibility | Presentation-only and additive; no stored data or contract change. `CatArt` variant rename (`content` → `idle`) is a breaking API change to one internal consumer (`AppHeader`), updated in the same slice. Rollback reverts UI only. |
| Quality | Component tests for `StatusChip`, retrofitted `IngredientCard` (kebab menu + chip), `InventoryPage` (FAB + CatArt states), upgraded `CatArt` variants, and grouped history; update existing `InventoryPage`/`InventoryHistoryPage` tests for the new markup; locale parity; full `test`/`lint`/`typecheck`/`build`; visual proof (light/dark × `uk`/`en`) of both screens. |

## Acceptance criteria

- [ ] `IngredientCard` shows name, quantity/presence text, and a `StatusChip`;
      all per-item actions are in a single accessible kebab menu with localized
      names; no inline action-button row remains.
- [ ] The inventory screen adds ingredients via a bottom-right FAB with a
      localized accessible name; the former top button is removed.
- [ ] `StatusChip` (shared) renders the mapping above and replaces the
      low-stock-only chip; low stock is its `warning` state.
- [ ] Loading, empty, and error states render the correct `CatArt` variant
      (`sleep`/`empty`/`confused`) with localized copy.
- [ ] `CatArt` renders faithful multi-color `idle`, `empty`, `sleeping`,
      `confused`, and `logo` variants; `AppHeader` uses `logo`; both light and
      dark render correctly.
- [ ] `InventoryHistoryPage` groups movements by day and shows signed,
      color-coded deltas; the ingredient filter and read-only behavior are
      unchanged.
- [ ] New i18n keys exist in both locales; `localeParity.test.ts` passes.
- [ ] New and updated component tests, the full suite, `lint`, `typecheck`,
      and `build` pass; visual proof captured for both screens in both schemes
      and locales.

## Milestones

1. `CatArt` upgrade (faithful SVGs + variant set) and `AppHeader` migration.
2. `StatusChip` shared primitive and ingredient status mapping.
3. `IngredientCard` retrofit (chip + kebab menu) and `InventoryPage` FAB.
4. Reusable async-state/empty primitive and `CatArt` state wiring.
5. History grouping and signed deltas.
6. Verification: full checks, visual proof, documentation update, index mark.

## Open questions (non-blocking)

- Exact day-group boundaries (Today/Yesterday vs. absolute date threshold) —
  resolved during planning using the existing date-format utility and locale.
- Whether decorative `paw`/`whisker` `CatArt` motifs are worth porting now —
  default no; add only if a state layout calls for them.

## References

- `docs/design/README.md`; `design/home-menu-kitchen-inventory-app/CatArt.dc.html`;
  `design/home-menu-kitchen-inventory-app/Home Menu.offline-src.html`;
  `design/Home Menu.png`.
- Code: `src/features/admin-inventory/components/IngredientList/components/IngredientCard/`,
  `src/features/admin-inventory/pages/InventoryPage.tsx`,
  `src/features/admin-inventory/pages/InventoryHistoryPage.tsx`,
  `src/shared/components/CatArt/`, `src/shared/components/AppHeader/`,
  `src/domain/inventory/isLowStock.ts`.

## Approval

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Author | Claude (agent) | 2026-07-10 | Submitted for review |
| Approver | Dmytro Tyshchenko | 2026-07-10 | Approved |
