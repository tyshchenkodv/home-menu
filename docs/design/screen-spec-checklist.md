# Screen specification checklist

Use this checklist twice:

1. **In Claude Design** — verify the mockup renders every item below for every
   screen before exporting.
2. **During transcription** — each screen gets its own file
   `docs/design/screens/<screen-slug>.md` answering every section in text, so
   an agent can implement the screen without opening the mockup.

A screen is "design-complete" only when every section below is either filled
in or explicitly marked `N/A` with a reason.

## Screens that must be covered

| # | Screen | Route | Audience |
| --- | --- | --- | --- |
| 1 | Login / onboarding | `/login` | all |
| 2 | Menu browse (date + meal selector, availability statuses) | `/menu` | user |
| 3 | Reservation confirmation flow (dialog/sheet) | from `/menu` | user |
| 4 | My orders (with cancellation rules) | `/orders` | user |
| 5 | Cooking request creation + list | `/requests` | user |
| 6 | Admin dashboard (summary tiles) | `/admin` | admin |
| 7 | Admin orders — Kanban with contextual actions | `/admin/orders` | admin |
| 8 | Prepared batches (register, counters, expiration, discard) | `/admin/batches` | admin |
| 9 | Dishes / recipes CRUD (**currently missing from mockup and nav**) | `/admin/dishes` | admin |
| 10 | Ingredient inventory + movement history (implemented — reference only) | `/admin/inventory` | admin |
| 11 | Settings (language, theme, default meal times) | `/settings` | all |

## Per-screen checklist

### A. Layout

- [ ] Mobile layout (bottom navigation, < `md`)
- [ ] Desktop layout (persistent drawer, ≥ `md`), including multi-column grids
- [ ] Dark theme variant of both
- [ ] Position of primary action (FAB vs. header button vs. inline)

### B. Data states

- [ ] Loading state (`CatArt sleeping` / skeletons — specify which)
- [ ] Empty state (`CatArt empty`, exact copy of the message and CTA)
- [ ] Error state (`CatArt confused`, retry affordance)
- [ ] Normal populated state
- [ ] Edge data: long dish/ingredient names, many items (20+), quantity 0,
      expired items, same-day boundary times

### C. Entity-status variations

For every card/row that represents a stateful entity, show one rendering per
status with the exact set of visible actions:

- [ ] Order card in each status: `pending`, `approved`, `cooking`, `prepared`,
      `reserved`, `consumed`, `rejected`, `cancelled` — which buttons are
      visible, which are disabled, which chip color is used
- [ ] Batch card: fresh / expiring soon / expired / fully reserved / discarded
- [ ] Dish availability chip: Ready now / Can be cooked / Unavailable /
      Not configured
- [ ] Role differences: what an admin sees vs. a regular user on shared
      concepts (e.g., an order)

### D. Dialogs and sheets

- [ ] Every dialog reachable from the screen, each with: title, body copy,
      field list, primary/secondary/destructive buttons, and cancel behavior
- [ ] Confirmation dialogs for destructive actions (discard, cancel, archive)
- [ ] Correction dialog (reason required), rejection dialog (reason optional)
- [ ] Batch registration dialog (planned vs. actual yield, expiration date)

### E. Forms and validation

- [ ] Every field: label, placeholder, unit suffix, keyboard type
- [ ] Validation rules and the exact error message per rule
      (required, min/max quantity, date not in the past, etc.)
- [ ] Disabled/submitting state of the submit button

### F. i18n

- [ ] All copy exists in both `uk` and `en`
- [ ] Layout tolerates the longer of the two translations

### G. Accessibility

- [ ] Touch targets ≥ 44px on mobile
- [ ] Status is never conveyed by color alone (chip label/dot + text)
- [ ] Focus order and dialog focus trap noted where non-obvious

## Transcription file template

```markdown
# <Screen name>

Route: `<route>` · Audience: <user|admin|all>

## Layout
<mobile, desktop, primary action placement>

## States
<loading / empty / error / populated — copy and CatArt variant for each>

## Components
<list each component top-to-bottom with props/variants and status mappings>

## Actions and dialogs
<every action: trigger, dialog contents, buttons, resulting mutation>

## Validation
<field-by-field rules and error messages>

## Open questions
<anything the mockup leaves ambiguous — must be empty before implementation>
```
