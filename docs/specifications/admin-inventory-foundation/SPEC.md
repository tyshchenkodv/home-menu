# Admin inventory foundation specification

| Field | Value |
| --- | --- |
| Slug | `admin-inventory-foundation` |
| Status | Approved |
| Request | Start the project with a real administrator inventory workflow and required libraries |
| Created | 2026-07-09 |
| Related artifacts | Current docs in `docs/`; no prior SPEC |

## Problem statement

Home Menu currently contains the agreed documentation and project-local agent
tooling, but no application scaffold or executable administrator workflow. The
first implementation slice needs to establish the React, Firebase, routing,
internationalization, and test foundation while proving it through a real
workflow instead of an empty shell.

Inventory is the right first administrator workflow because ingredients are
the source data for recipes, dish availability, cooking, and low-stock
monitoring. The workflow must support both quantity-tracked and presence-only
ingredients from the start, preserve audit history through inventory
movements, and enforce administrator-only access through the same Firebase
boundary the MVP will use in production.

## Goals

1. Scaffold the client application foundation with React, TypeScript, Vite,
   Material UI, HashRouter, i18next, Firebase Auth, Cloud Firestore, and the
   documented test tooling.
2. Provide Google Sign-In authentication with no runtime development bypass.
   Access to administrator routes requires a manually provisioned active
   `users/{uid}` document with `role: "admin"`.
3. Implement an administrator inventory page for creating, editing, archiving,
   restoring, and viewing ingredients.
4. Support quantity ingredients with `gram`, `milliliter`, and `piece`
   canonical storage, while allowing `g/kg`, `ml/l`, and `pieces` input in the
   UI.
5. Support presence-only ingredients with separate user-facing actions to mark
   an ingredient present or absent.
6. Make `lowStockThreshold` optional for quantity ingredients and not
   applicable to presence ingredients.
7. Record stock changes and presence changes in append-only
   `inventoryMovements` documents and expose a separate inventory history route
   with an ingredient filter.
8. Enforce ingredient and inventory movement reads and writes through typed
   Firebase services, Firestore converters, transactions, and Security Rules.
9. Provide Ukrainian and English UI strings with `uk` as the default language
   and `en` as the fallback.
10. Add tests that cover domain validation, unit conversion, locale parity,
    admin-only routing behavior, Firestore Rules, and inventory mutation
    transactions.

## Non-goals

- User menu, user orders, reservations, and cooking requests.
- Dish and recipe management.
- Affected-dish indicators on ingredients.
- Prepared batches, batch discard, and batch history.
- Production Firebase credentials, service account files, concrete project IDs,
  real UIDs, real emails, or household inventory data.
- Runtime authentication bypasses or local mock administrator modes.
- Cloud Functions, Storage, paid services, offline writes, or backend runtime
  services.
- Desktop-specific table layout for the inventory list.
- Automated data migration from an existing deployed application.

## Workflow, domain, and data model

### Application foundation

The implementation introduces the executable SPA around the documented
architecture. The app uses `HashRouter` and starts with the routes needed for
the first workflow:

- `/#/login`;
- `/#/admin`;
- `/#/admin/inventory`;
- `/#/admin/inventory/history`.

Additional documented administrator destinations may appear as disabled,
placeholder, or navigation-only entries only when needed to make the shell
coherent. They must not imply that dishes, batches, orders, or settings are
implemented.

### Authentication and authorization

The first runtime auth model matches the current documentation:

1. The administrator signs in with Google.
2. Firebase Auth creates or locates the Auth user.
3. The client reads `users/{uid}`.
4. Missing, inactive, or non-admin profiles cannot access administrator routes.
5. A manually provisioned active profile with `role: "admin"` grants access.

Route guards are a UX boundary only. Firestore Security Rules remain the
authorization boundary for data access.

### Ingredients

The first workflow uses the documented `ingredients/{ingredientId}` shape:

```ts
type BaseUnit = 'piece' | 'gram' | 'milliliter' | 'presence'

interface Ingredient {
  name: string
  trackingMode: 'quantity' | 'presence'
  baseUnit: BaseUnit
  quantity: number | null
  isPresent: boolean | null
  lowStockThreshold: number | null
  archivedAt: Timestamp | null
  createdAt: Timestamp
  createdBy: string
  updatedAt: Timestamp
  updatedBy: string
}
```

Quantity ingredients must satisfy:

- `trackingMode == "quantity"`;
- `baseUnit` is `gram`, `milliliter`, or `piece`;
- `quantity >= 0`;
- `isPresent == null`;
- `lowStockThreshold == null` or `lowStockThreshold >= 0`.

Presence ingredients must satisfy:

- `trackingMode == "presence"`;
- `baseUnit == "presence"`;
- `quantity == null`;
- `isPresent` is `true` or `false`;
- `lowStockThreshold == null`.

Ingredient names are user-generated domain data. The app stores them as
entered and does not translate them.

### Unit conversion

Quantity input is user-friendly but persisted canonically:

- grams and kilograms write `baseUnit: "gram"` and canonical gram values;
- milliliters and liters write `baseUnit: "milliliter"` and canonical
  milliliter values;
- pieces write `baseUnit: "piece"` and canonical piece values.

The UI must reject `NaN`, infinity, negative values, and invalid unit/mode
combinations before issuing a command. Infrastructure and transaction code must
repeat the relevant invariants before writing.

### Inventory movements

The first workflow uses the documented `inventoryMovements/{movementId}` shape:

```ts
type MovementType = 'restock' | 'cooking' | 'correction' | 'archive_adjustment'

interface InventoryMovement {
  ingredientId: string
  ingredientName: string
  type: MovementType
  deltaQuantity: number | null
  presenceBefore: boolean | null
  presenceAfter: boolean | null
  balanceAfter: number | null
  cookingRequestId: string | null
  preparedBatchId: string | null
  note: string | null
  createdAt: Timestamp
  createdBy: string
}
```

This SPEC implements inventory-created movement types only:

- `restock` for positive quantity additions and marking a presence ingredient
  present;
- `correction` for setting a quantity ingredient to an exact balance or
  marking a presence ingredient absent.

`cooking` is reserved for the future cooking workflow. `archive_adjustment`
remains part of the documented domain vocabulary but is not required for
archive or restore in this slice.

Every stock or presence mutation updates the ingredient and creates the
movement in one Firestore transaction. Movement documents are append-only and
are never edited or physically deleted.

### Archiving and restoring

Archiving is a soft-delete workflow:

- setting `archivedAt` hides the ingredient from the active tab and future
  active ingredient selectors;
- it does not require zero quantity or `isPresent == false`;
- it does not create an inventory movement by itself;
- it preserves the current stock or presence state;
- it keeps the ingredient visible in the archived tab and available in the
  inventory history filter.

Restoring clears `archivedAt` and updates `updatedAt` and `updatedBy`. Restore
does not create an inventory movement because it does not change stock or
presence.

### History route

`/#/admin/inventory/history` displays append-only inventory movements. It
supports at least filtering by ingredient. Links from an ingredient on the
inventory page may navigate to the history route with that ingredient selected.

The first history view is an audit list, not a reporting dashboard. Date and
movement-type filters are allowed if they are cheap to include, but they are
not required for acceptance.

## UX and accessibility

The inventory UI is mobile-first. The primary list uses responsive cards or
list rows that work well on small screens and remain usable on desktop.
Desktop-specific data tables are out of scope for this first slice.

The inventory page includes:

- active and archived tabs;
- loading, error, empty, and ready states;
- create ingredient action;
- edit action;
- archive and restore actions with confirmation for archive;
- restock action for quantity ingredients;
- correction action for quantity ingredients with a required reason;
- mark present and mark absent actions for presence ingredients;
- low-stock indicator when a quantity ingredient has a threshold and the
  current quantity is at or below it;
- history navigation for each ingredient.

The history page includes:

- loading, error, empty, and ready states;
- ingredient filter;
- movement entries showing ingredient name snapshot, movement type, delta or
  presence transition, balance after, note when present, and creation time.

All visible labels, validation messages, button names, dialog text, empty
states, error messages, and icon-only accessible names must come from i18next
resources in both `uk` and `en`. The application defaults to `uk` and falls
back to `en`.

Dialogs must have accessible names, focus management, keyboard submission where
appropriate, cancellation, and duplicate-submit prevention. Destructive or
accounting-sensitive actions must not rely on color alone.

## Impact analysis

| Area | Impact |
| --- | --- |
| Architecture | Introduces the executable SPA under `src/` using the documented `app`, `domain`, `features`, `infrastructure`, `locales`, and `shared` boundaries. Inventory domain rules remain pure TypeScript. Firebase access stays behind typed infrastructure and feature hooks. |
| Firebase | Adds Firebase app initialization from environment variables, Auth adapter, Firestore converters and services for `users`, `ingredients`, and `inventoryMovements`, admin-only Security Rules, and emulator Rules tests. No credentials or concrete project IDs are committed. |
| Domain | Adds ingredient invariants, quantity/presence validation, canonical unit conversion, low-stock derivation, archive/restore state, and movement command validation. Stock changes and movement creation must be transactionally consistent. |
| Privacy | Uses only placeholders and synthetic test identities such as `.test` examples. No real Google account data, UIDs, Firebase project identifiers, service account JSON, production URLs, or household inventory may enter tracked files. Runtime logs must not expose secrets. |
| i18n | Adds matching `uk` and `en` translation resources for every visible and accessible string. Domain enums and Firestore values remain English and language-neutral. User-entered ingredient names and notes are not translated. |
| UX | Adds admin login, route guards, admin shell sufficient for inventory, mobile-first inventory cards/lists, active/archive tabs, dialogs, confirmation states, history route, and explicit async states. Non-admin and unprovisioned users receive localized access states. |
| Compatibility | There is no deployed app or existing data to migrate. The schema matches current docs and is additive for future dishes, recipes, cooking, and user workflows. Rollback before merge is a code revert; after deployment, data remains compatible with the documented model. |
| Quality | Requires static checks, unit tests for domain conversion and validation, component tests for primary UI states, locale parity tests, Firestore Rules tests, transaction/service tests where practical, and documentation updates for actual setup and commands. |

## Acceptance criteria

- [ ] The repository contains an executable React TypeScript Vite SPA with the
      documented core libraries installed and locked.
- [ ] `/#/login` supports Google Sign-In through Firebase Auth.
- [ ] Administrator routes are inaccessible to unauthenticated, unprovisioned,
      inactive, and non-admin users.
- [ ] A manually provisioned active admin profile can reach
      `/#/admin/inventory`.
- [ ] The inventory page can create quantity ingredients with canonical
      Firestore units after accepting `g/kg`, `ml/l`, or `pieces` UI input.
- [ ] The inventory page can create presence ingredients without quantity or
      low-stock fields.
- [ ] Quantity restock writes the ingredient balance and an append-only
      `restock` movement in one transaction.
- [ ] Quantity correction writes the exact balance and an append-only
      `correction` movement with a required reason in one transaction.
- [ ] Presence actions mark ingredients present or absent and create matching
      append-only movements in the same transaction.
- [ ] Ingredients can be archived with non-zero quantity or `isPresent == true`
      without creating an inventory movement.
- [ ] Archived ingredients appear in an archived tab and can be restored.
- [ ] The inventory history route displays movement history and can filter by
      ingredient.
- [ ] All user-facing strings are defined in matching `uk` and `en` resources,
      with `uk` as default and `en` as fallback.
- [ ] Firestore Rules deny unauthorized access and allow only active admins to
      create, update, archive, restore, and mutate inventory documents.
- [ ] Tests cover domain validation, unit conversion, locale key parity,
      route/access behavior, Rules access, and inventory transaction behavior
      proportionate to this slice.
- [ ] README and current docs are updated with actual local setup, Firebase
      environment variable names, and verification commands.

## Milestones

1. Application scaffold, dependency baseline, routes, theme, i18n, and test
   harness.
2. Firebase initialization, Auth provider, admin profile loading, and route
   guards.
3. Ingredient domain model, conversion helpers, validation, Firestore
   converters, services, and Rules.
4. Inventory page UI with active/archive tabs and ingredient create/edit,
   archive, and restore flows.
5. Quantity and presence mutation transactions with inventory movements.
6. Inventory history route with ingredient filtering.
7. Test coverage, documentation updates, and verification.

## Non-blocking open questions

- The exact visual density, icon choices, and layout details of the mobile
  inventory cards can be finalized during implementation while preserving the
  functional requirements above.
- Date and movement-type filters for the history route are optional in this
  slice unless they prove cheap enough to include without delaying the core
  workflow.

## References

- `README.md`
- `docs/01-overview.md`
- `docs/02-architecture.md`
- `docs/03-data-model.md`
- `docs/04-business-logic.md`
- `docs/05-components-and-flows.md`
- `docs/06-auth-and-security.md`
- `docs/07-testing-and-cicd.md`
- `docs/08-deployment.md`
- `docs/specifications/README.md`

## Approval

| Date | Approver | Notes |
| --- | --- | --- |
| 2026-07-09 | User (chat) | Approved after review; proceed to PLAN. Admin-only scope confirmed; regular user deferred. |
