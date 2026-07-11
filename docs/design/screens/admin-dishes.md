# Dishes / recipes CRUD (admin)

Route: `/admin/dishes` · Audience: admin

Source: `design/home-menu-kitchen-inventory-app/Home Menu.dc.html` — screens
"Dishes" (EN list), "Dish form" (EN edit), section "05c Керування стравами ·
Dishes management" ("More sheet (admin)", "Dishes list UA", "Dishes empty",
"Dish form UA", "Archive dish dialog"), plus 05g·10 data states and 05e·7
dialog. Cross-screen conventions: see `shared-patterns.md`.

## Layout

- **Mobile (< md)**: app canvas `background.default`; white header with page
  title «Страви» / "Dishes" and two underline tabs «Активні» (Active) /
  «Архів» (Archived); scrollable card list; primary action is a circular
  FAB "+" (`primary.main`) bottom-right above the BottomNavigation.
- **Navigation placement**:
  - Desktop drawer (md+): item «Страви · Dishes» in the «Адмін» group,
    between «Запити на готування» and «Інвентар»; active item is a filled
    `primary.main` pill with white text.
  - Mobile (resolved decision): the BottomNavigation third slot for admins
    is a dedicated «Адмін · Admin» tab per the English mockups, NOT the
    «Більше · More» bottom sheet (the More-sheet variant from the Dishes
    management section is superseded). The Admin tab leads to the admin
    area, from which «Страви · Dishes» is reached. This amends the approved
    navigation-shell spec; a new linked spec will cover it.
- **Desktop (≥ md)**: not shown as a dedicated mockup; coverage table marks
  responsive as "drawer + More (05c)" — list follows the generic
  cards-into-grid rule from `shared-patterns.md`.
- Dark theme: token remap only («токени 06»), no dedicated dark mockup.
- Dish form is a full-screen page/route (not a dialog): header with close
  «✕» + title, scrollable body, sticky footer button row.

## States

- **Loading**: CatArt `sleep` + caption «Завантаження…» (Loading…) above
  skeleton cards (generic pattern).
- **Empty** (exact copy): CatArt `empty` (150×136 full-screen variant),
  headline «Ще немає страв» (No dishes yet), body «Додайте першу страву з
  рецептом — і вона з'явиться в меню, щойно будуть інгредієнти.» (Add the
  first dish with a recipe — it will appear in the menu as soon as the
  ingredients are there.), contained CTA «+ Додати страву» (+ Add dish).
  (The compact 05g·10 tile shortens the body to «Додайте першу страву з
  рецептом.».)
- **Error**: CatArt `confused`, «Не вдалося завантажити» (Failed to load),
  «Спробуйте ще раз.» (Try again.), outlined «Повторити» (Retry).
- **Populated**: card list, one card per dish (below).

## Components

Top-to-bottom:

1. **Header** — h1 «Страви» / "Dishes"; tabs «Активні»/«Архів»
   ("Active"/"Archived", underline style, active `primary.dark` +
   `primary.main` indicator).
2. **DishAdminCard** (white paper, radius ~15, e1 shadow):
   - Row 1: dish name (h4, clamps to 2 lines per edge rule) + availability
     StatusChip top-right (`flex: none`), one of the 4 canonical states —
     see `shared-patterns.md`. List copy uses full labels: «Готово зараз»,
     «Можна приготувати», «Недоступно», «Не налаштовано» (the EN list
     specimen shortens to "Ready" / "Can cook" / "Unavailable").
   - Row 2 (meta, small `text.secondary`), varies by status:
     - available/cookable: «3 інгредієнти» (3 ingredients) — meta shows the
       ingredient count only (Resolved decision: there is no portion-size
       field in the data model, so no "Порція … г" segment is shown);
     - unavailable: «Бракує: філе лосося, кріп» (Missing: salmon fillet,
       dill);
     - not configured: «Рецепт порожній — страва не з'являється в меню»
       (Recipe is empty — the dish does not appear in the menu).
   - Row 3: meal-type category tags (pastel pills — Обід, Вечеря, Суп …).
   - Row 4 (actions):
     - normal statuses: two outlined half-width buttons «Редагувати» (Edit,
       primary-outlined) + «В архів» (Archive, neutral-outlined);
     - not-configured card: dashed card border, dimmed name, single
       full-width contained `secondary.main` button «Налаштувати рецепт»
       (Configure the recipe) — no Edit/Archive row shown.
3. **FAB "+"** — opens the create form («Нова страва»).
4. **BottomNavigation** — Меню / Замовлення / Адмін (admin), «Адмін»
   ("Admin") active on this screen (resolved decision — dedicated Admin
   tab, not the More sheet).

### Dish form («Нова страва» create / "Edit dish" edit)

Header: «✕» close + title «Нова страва» (New dish) or "Edit dish"
(uk: «Редагувати страву» — EN mockup only shows the English title).

Fields top-to-bottom (UA form, the canonical one):

1. «Назва \*» (Name, required) — single text field, no separate uk/en pair.
   Example value «Грибне різото». (Resolved: the `Dish` data model has one
   `name` field, not a uk/en pair; the EN-mockup "Name (EN)" second field
   was not built.)
2. «Опис» (Description) — single optional multiline field, no uk/en pair
   (same resolution as Name), present in BOTH the create and edit forms;
   shown under the dish name in menu browse (`menu-browse.md`).
3. «Рецепт» (Recipe) section header + link-button «+ Додати інгредієнт»
   (+ Add ingredient) in `secondary` color. Ingredient rows inside a
   grouped list (`action.hover`-tinted container):
   - each row: ingredient select (flex-grow; placeholder «Оберіть
     інгредієнт…» — Choose an ingredient…), quantity input (e.g. 300),
     unit dropdown (e.g. «г ▾»), remove «✕» icon-button at the row end
     (turns `error.main` on the incomplete row).
   - helper below the list: «Одиниці: г · кг · мл · л · шт · "наявність"»
     (Units: g · kg · ml · l · pcs · "presence").
4. «Прийоми їжі» (Meal types) — multi-select filter chips: selected =
   `primary.main` filled with leading «✓» («✓ Обід», «✓ Вечеря»),
   unselected = grey chip («Сніданок»). EN specimen: Breakfast / ✓ Lunch /
   ✓ Dinner. At least one meal type is required (resolved decision).

Footer (sticky, divider above):

- Create form: «Скасувати» (Cancel, outlined, flex 1) + «Зберегти страву»
  (Save dish, contained primary, flex 2).
- Edit form (resolved decision): «Скасувати» (Cancel, outlined) + «В архів»
  (Archive, outlined neutral) + «Зберегти страву» (Save dish, contained
  primary) — Cancel + Archive + Save, superseding the two-button EN
  specimen footer.
- Submit states per `shared-patterns.md`: the Save button is disabled while
  the form is invalid — name empty, an added recipe row incomplete, or no
  meal type selected — and a zero-recipe draft IS allowed (it saves as
  «Не налаштовано» / "Not configured"); submitting shows spinner +
  «Збереження…».

## Actions and dialogs

| Action | Trigger | Result |
| --- | --- | --- |
| Create dish | FAB "+" or empty-state CTA «+ Додати страву» | opens «Нова страва» form; save creates the dish |
| Edit dish | card «Редагувати» | opens the form pre-filled |
| Configure recipe | «Налаштувати рецепт» on a not-configured card | opens the form focused on the Recipe section |
| Add/remove recipe row | «+ Додати інгредієнт» / row «✕» | appends/removes an ingredient row |
| Archive | card «В архів» or form footer «Archive» | opens dialog 05e·7 (below); confirming archives the dish (it leaves the menu, order history preserved, restorable from the «Архів» tab) |
| Cancel form | «✕» header or «Скасувати» | closes without saving |

**Archive confirmation dialog** (05e·7, full copy): warning-tone round badge
(folder icon on `warning.light`); title «Архівувати страву?» (Archive the
dish?); body — list variant: «"Запечений лосось" зникне з меню. Історія
замовлень збережеться, страву можна відновити з архіву.» ("Baked salmon"
will disappear from the menu. Order history is kept; the dish can be
restored from the archive.) — the 05e specimen uses the shorter «…зникне з
меню, історія збережеться. Можна відновити з архіву.». Buttons: «Залишити»
(Keep, outlined) / «В архів» (To archive, contained `warning.main`).

## Validation

| Field | Rule | Message (uk · en) |
| --- | --- | --- |
| Назва | required, single field (no uk/en pair) | «Обов'язкове поле» · "Required field" |
| Опис | optional, single field (no uk/en pair) | — |
| Recipe (as a whole) | zero rows allowed — the dish saves with status «Не налаштовано» (Not configured) and stays out of the menu | — |
| Recipe row | every ADDED row must be complete: ingredient chosen and quantity > 0 | «Заповніть рядок або видаліть його» · "Complete the row or remove it"; row «✕» highlighted `error.main` |
| Прийоми їжі | at least one meal type required | «Оберіть хоча б один прийом їжі» · "Select at least one meal type" |
| Submit | disabled while any error exists; submitting blocks re-click | see `shared-patterns.md` |

Errors appear on blur (global rule, 05f).

## Resolved decisions

- **Name and description fields**: implemented as a single `name` field and
  a single optional `description` field each — no uk/en field pair. The
  EN-mockup "Name (EN)" second field was not built; the description is
  shown under the dish name in menu browse.
- **No portion-size field**: the `Dish` data model
  (`docs/03-data-model.md`) has no portion/quantity field, so the mockup's
  «Розмір порції» form field and its min/max (50–2000 g) validation, and
  the card-meta "Порція 350 г" segment, do not exist in the built app. The
  card meta shows the ingredient count only.
- **Edit-form footer**: Cancel + Archive + Save («Скасувати» + «В архів» +
  «Зберегти страву»), replacing the two-button Archive + Save EN specimen.
- **Recipe validation**: a dish CAN be saved with zero recipe rows (it gets
  status «Не налаштовано» / "Not configured" and does not appear in the
  menu); every added recipe row must be complete (ingredient chosen,
  quantity > 0); at least one meal type is required. The Save button is
  disabled while the form is invalid (name empty, an incomplete recipe row,
  or no meal type selected). Error copy placeholders (uk · en): «Заповніть
  рядок або видаліть його» · "Complete the row or remove it"; «Оберіть хоча
  б один прийом їжі» · "Select at least one meal type".
- **Mobile navigation**: dedicated "Admin" bottom tab (English mockups),
  not the «Більше»/More sheet — amends the approved navigation-shell spec;
  a new linked spec will cover it.

## Open questions

- Ukrainian title for the edit form is never shown (only "Edit dish" in the
  EN specimen) — proposed «Редагувати страву», needs confirmation.
- The «Архів» (Archived) tab content is never mocked — presumed identical
  cards with a "Restore" action; action set unconfirmed.
