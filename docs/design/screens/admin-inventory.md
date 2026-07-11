# Ingredient inventory + movement log (admin)

Route: `/admin/inventory` (history: movement log sub-view) · Audience: admin

Status: **already implemented** (`src/features/admin-inventory/`) — this
transcription records the UPDATED mockup as reference; deltas worth
retrofitting are listed under "Open questions".

Source: `design/home-menu-kitchen-inventory-app/Home Menu.dc.html` — screens
"Inventory", "Correction dialog", "Inventory history", plus 05g·9 data
states, 05e·4 dialog, 05h edge cases. Cross-screen conventions: see
`shared-patterns.md`.

## Layout

- **Mobile (< md)**: canvas `background.default`; white header row with h1
  «Інвентар» / "Inventory"; card list; FAB "+" (`primary.main`) bottom-right
  for adding an ingredient; BottomNavigation below («Адмін» / "Admin" tab
  active — resolved decision: the dedicated Admin tab replaces the mockup's
  «Більше»/More sheet, see `shared-patterns.md`).
- **Movement log** (resolved decision — as built): a separate route
  (`/admin/inventory/history`, `InventoryHistoryPage`) reached via each
  ingredient card's kebab menu «Історія» (History) item, rather than the
  mockup's header «History ›» text link. `InventoryTabs` on the main
  Inventory page only switches «Активні» / «Архів» (Active / Archived); it
  does not include a History tab. The history page shows a horizontal
  movement-type filter chip row and a read-only grouped list.
- **Desktop (≥ md)**: drawer item «Інвентар» (with low-stock count badge in
  the 06b desktop dashboard mockup); no dedicated desktop mockup —
  responsive marked "n/a" in the coverage table (generic grid rule).
- Dark theme: token remap only («токени 06»).

## States

(Generic 4-state pattern; see `shared-patterns.md`.)

- **Loading**: CatArt `sleep`, caption «Перелічуємо запаси…» (Counting the
  supplies…), skeleton cards.
- **Empty** (as built): CatArt `empty`, headline «Інвентар порожній»
  (Inventory is empty), body «Додайте перший інгредієнт, щоб рецепти могли
  рахувати доступність.» (Add the first ingredient so recipes can compute
  availability.), contained CTA «+ Додати інгредієнт» (+ Add ingredient).
  Matches the implementation: the active-inventory empty state renders both
  a headline and body copy (not headline-only).
- **Error**: CatArt `confused`, «Не вдалося завантажити» (Failed to load),
  «Перевірте з'єднання.» (Check the connection.), outlined «Повторити»
  (Retry).
- **Populated**: ingredient cards (below).
- **Edge cases** (05h): zero quantity is shown explicitly («0 г —
  закінчилися» in `error.main`, chip «Немає», Restock CTA; dependent dishes
  become «Недоступно»); 20+ items get alphabetical order, virtualization,
  search from 10 items, sticky letter groups from 20.

## Components

1. **Header** — h1 + «History ›» link (`primary.dark` text button).
2. **IngredientCard** (white paper, radius ~15, e1):
   - name (h4) + quantity line «120 g left» / «2.4 kg left» (bold quantity,
     regular muted "left"); presence-tracked items show «Tracked by
     presence» instead of a quantity.
   - **Stock status chip** top-right (label-only pill, no dot):
     - «Мало» · "Low stock" — `error.light` bg / `error.dark` text; the
       card border is also error-tinted;
     - «Є» · "In stock" — `success.light` / `success.dark`;
     - «Немає» · "Out" — neutral grey (used both for presence-tracked
       "absent" and quantity 0).
   - **Actions** (resolved decision — as built, supersedes the mockup's
     inline per-status Restock/Correct buttons): a kebab (⋮) icon button
     opens a menu with «Історія» (History), «Редагувати» (Edit),
     «Поповнити» (Restock), «Коригувати» (Correct), and «В архів» (Archive)
     — or «Відновити» (Restore) on the Archived tab. Presence-tracked
     ingredients get "Mark present"/"Mark absent" in place of
     Restock/Correct. Every card, regardless of stock status, gets the same
     kebab menu — there is no per-status inline button pair and no
     border-tint distinction for actions.
3. **FAB "+"** — add ingredient.
4. **Movement log**:
   - filter chips (resolved decision — as built, supersedes the mockup's
     All/Restock/Correction/Consumed set): «All / Restock / Correction /
     Cooking / Archive adjustment» (`inventory.history.type.*`), matching
     the four `MovementType` values in `docs/03-data-model.md` (there is no
     "Consumed" movement type — cooking deducts recipe ingredients via the
     `cooking` type). Selected chip = `primary.main` filled; others
     outlined.
   - date group headers (uppercase overline): "Today" / "Yesterday"
     (uk «Сьогодні» / «Вчора»).
   - entry row: ingredient name + meta «type · actor · time» (e.g.
     «Correction · Olena · 14:20», «Restock · Ihor · 09:05», «Cooking ·
     risotto ×4 · 08:40», «Presence → Out · Ihor») and a right-aligned
     signed delta, colored by sign as built: `success` for a positive delta
     (e.g. «+2 kg» restock), `error` for a negative delta (e.g. «−40 g»
     correction, «−240 g» cooking deduction); presence toggles show text
     («set out») with no delta color.
   - the log is read-only and append-only.

## Actions and dialogs

| Action | Trigger | Dialog / result |
| --- | --- | --- |
| Add ingredient | FAB "+" or empty-state CTA | ingredient form (not mocked beyond the CTA — existing implemented dialog stands) |
| Restock | kebab menu «Поповнити» | restock dialog (not mocked; implemented `RestockDialog` stands) |
| Correct stock | kebab menu «Коригувати» | **Stock correction dialog** (below) |
| View history | kebab menu «Історія» | navigates to `/admin/inventory/history` (movement log page) |
| Edit / Archive / Restore | kebab menu «Редагувати» / «В архів» / «Відновити» | ingredient edit form / archive toggle |
| Filter history | filter chips (All / Restock / Correction / Cooking / Archive adjustment) | filters entries by movement type |

**Stock correction dialog** (05e·4; reason REQUIRED):

- Title «Коригування залишку» / "Stock correction"; subtitle
  «Гриби · зараз 120 г» / "Mushrooms · current 120 g".
- Field «Нова кількість» / "New quantity" — numeric with unit suffix «г».
- Field «Причина *» / "Reason * required" — multiline; placeholder
  «Опишіть, чому змінюється залишок…» (Describe why the stock changes…);
  error «Вкажіть причину — поле обов'язкове» (Provide a reason — the field
  is required); filled example «Spoiled — discarded 40 g».
- Helper: «Запис додається до незмінного журналу руху.» / "Logged to the
  append-only movement history."
- Buttons: «Скасувати»/"Cancel" (outlined) + «Зберегти»/"Save" (contained
  primary) — Save DISABLED while the reason is empty.

## Validation

| Field | Rule | Message |
| --- | --- | --- |
| Correction reason | required | «Вкажіть причину — поле обов'язкове» |
| New quantity | numeric with unit suffix; "0" allowed and displayed explicitly | min/max not specified in mockup |
| Submit | disabled while invalid; submitting spinner per `shared-patterns.md` | — |

## Open questions (visual deltas worth retrofitting)

Compare against the implemented `src/features/admin-inventory/`:

- **Low-stock border tint**: the mockup tints the whole card border in
  `error` tones for «Мало»; verify whether the implemented `IngredientCard`
  applies the same border accent (action surfacing is resolved below — a
  kebab menu on every card, not per-status inline buttons).
- «Correct» button and "Tracked by presence" copy appear only in the EN
  mockup; canonical Ukrainian strings need confirmation (proposed
  «Коригувати», «Облік за наявністю»).
- FAB placement (above BottomNavigation) vs. the implemented primary-action
  placement — verify.

## Resolved decisions

- **Restock and ingredient add/edit dialogs**: not mocked in the design —
  the already-implemented dialogs in `src/features/admin-inventory/` are
  canon (accepted default).
- **Card actions surfaced via kebab menu**: every `IngredientCard`, in any
  stock state, exposes its actions through a single kebab (⋮) icon menu
  (History / Edit / Restock / Correct / Archive, or Restore on the Archived
  tab; presence-tracked ingredients get Mark present/Mark absent instead of
  Restock/Correct) — not the mockup's inline per-status Restock/Correct
  button pair. Accepted as the built default.
- **Movement-type filter chips**: All / Restock / Correction / Cooking /
  Archive adjustment, matching the four `MovementType` enum values exactly
  (there is no "Consumed" chip — cooking deductions use the `cooking`
  type). Supersedes the mockup's All/Restock/Correction/Consumed set.
- **Signed delta coloring**: `success` for a positive delta, `error` for a
  negative delta, regardless of movement type (a restock is always
  positive/success; a correction or cooking deduction that lowers stock is
  negative/error). Supersedes the mockup's three-way
  error/success/neutral-by-type scheme.
- **Navigation to history**: the implementation reaches the movement log
  via a dedicated route (`/admin/inventory/history`, `InventoryHistoryPage`)
  linked from each card's kebab menu, not the mockup's header «History ›»
  text link; `InventoryTabs` on the main page only toggles Active/Archived.
