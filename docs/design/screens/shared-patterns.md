# Shared design patterns (cross-screen canon)

Source: `design/home-menu-kitchen-inventory-app/Home Menu.dc.html` (sections
04 Components, 05d Status matrices, 05e Dialogs, 05f Forms & validation,
05g Data states, 05h Edge data, 05i Responsive & dark, 05j Coverage,
06 Dark theme, 06b Desktop).

Screen transcriptions in this folder reference this file instead of repeating
the matrices. Colors are given as MUI palette slots only.

## Component specimens (04)

### Buttons

| Variant | Look | Usage |
| --- | --- | --- |
| Contained primary | `primary.main` fill, white text, radius 14, soft primary-tinted shadow | main CTA — "Reserve portion" / «Зарезервувати» |
| Contained secondary | `secondary.main` fill, white text | secondary flow CTA — "Request cooking" / «Запит на готування» |
| Outlined | transparent, 1.5px border in a light `primary` tone, `primary.dark` text | neutral secondary actions |
| Text | no border/fill, `primary.dark` text | tertiary actions |
| Contained error | `error.main` fill, white text | destructive — "Cancel order" / «Скасувати замовлення» |
| Disabled | muted neutral fill (`action.disabledBackground`), `text.disabled` text, `cursor: not-allowed` | invalid form, blocked action |
| Submitting | lightened `primary` fill, white text, leading circular spinner, repeated click blocked | e.g. «Збереження…» ("Saving…"), «Вхід…» ("Signing in…") |
| FAB | circular 48–52px, `primary.main`, white "+" | screen primary create action |

Buttons never use all-caps; label font is Nunito 700.

### StatusChip · dish availability (4 states, app-wide)

Pill chip with an 8px status dot + label (status never conveyed by color
alone).

> **Implementation note (`mvp-audit-remediation`, Slice 3).** Shipped as
> specified: `StatusChip` renders the leading 8px dot plus label, using
> light-tinted pastel fills (not saturated `.main` fills) in both light and
> dark themes.

| State | Ukrainian | English | Palette |
| --- | --- | --- | --- |
| Ready now | «Готово зараз» (short: «Готово») | "Ready now" ("Ready") | `success` (light bg, dark text, `success.main` dot) |
| Can be cooked | «Можна приготувати» (short: «Можна») | "Can be cooked" ("Can cook") | `warning` |
| Unavailable | «Недоступно» | "Unavailable" | neutral grey (`text.disabled`-tone chip) |
| Not configured | «Не налаштовано» | "Not configured" ("Not set") | `secondary` |

### Category tags

Pastel filled pills: Breakfast/«Сніданок» (peach), Lunch/«Обід» (mint),
Dinner/«Вечеря» (lavender), Soup/«Суп» (sky), Dessert/«Десерт» (butter).
These map to the pastel accent tints in the palette section (chip fills),
not to semantic slots.

### Inputs (field anatomy, 05f)

- Label above the field: small bold `text.secondary`; required marker
  `*` in `error.main`.
- Default: white bg, 1.5px border in a muted divider tone, radius 12 (token
  10 for plain inputs), placeholder in a muted rose-grey.
  Placeholder example: «Напр., "Грибне різото"» ("E.g., 'Mushroom risotto'").
- Focus: border `primary.main` + 3px `primary.light` focus ring.
- Unit suffix rendered inside the field, right-aligned, regular weight
  `text.secondary` (e.g. `250 | г`).
- Error: border `error.main`, light error-tinted bg, helper message below in
  `error.main`. Errors appear on blur.
- Disabled/read-only: muted bg, `text.secondary` value (e.g. planned yield).

Canonical validation messages (uk · en equivalent):

| Rule | Ukrainian message | English equivalent |
| --- | --- | --- |
| Required | «Обов'язкове поле» | "Required field" |
| Portion min/max | «Мінімум 50 г, максимум 2000 г» | "Minimum 50 g, maximum 2000 g" |
| Date in past | «Дата не може бути в минулому» | "Date cannot be in the past" |
| Expiry in past | «Термін придатності не може бути в минулому» | "Expiration cannot be in the past" |
| Reservation max | «Максимум 4 — стільки вільних порцій у партії» | "Maximum 4 — that's how many free portions the batch has" |
| Correction reason | «Вкажіть причину — поле обов'язкове» | "Provide a reason — the field is required" |
| Email format (login) | «Невірний формат пошти» | "Invalid email format" |
| Login server error | «Невірна пошта або пароль» | "Wrong email or password" |

Submit button is disabled while the form is invalid («Кнопка вимкнена, поки є
помилки валідації» — "Button disabled while validation errors exist").

### Tabs / navigation

- Segmented tabs (filled pill on `action.hover` track) for Active/History.
- Underline tabs (2.5px `primary.main` indicator) for meal filters.
- Navigation (`navigation-drawer-signout`, superseding the earlier
  BottomNavigation described below): the left `Drawer` is the single
  navigation surface on every viewport, listing every destination the current
  role can reach. At `md`+ it stays permanent and always visible, as before.
  Below `md` it is hidden by default and opens as a temporary overlay from a
  hamburger `IconButton` in the header; it closes on destination selection,
  backdrop tap, or `Escape`. The drawer carries a footer, pinned below the
  navigation list and separated by a `Divider`, stacked top-to-bottom: a
  full-width `LanguageSwitcher` (UK/EN), a full-width theme-toggle row
  (`ColorSchemeMenuItem`, light↔dark with a labeled moon/sun row), then the
  current account's email (falling back to display name, then to a generic
  "Signed in" label) and a sign-out control. The language and theme controls
  live here only — the header no longer carries them. There is no mobile
  `BottomNavigation` anymore.

## OrderCard status matrix (05d) — every status × role

Card: dish name, meta line (portions · date, meal; admin adds requester name
and batch number), status chip top-right, action row below.

| # | Status | Chip (uk · en) | Chip palette | User actions | Admin actions |
| --- | --- | --- | --- | --- | --- |
| 1 | pending | «Очікує» · Pending | `primary.light` | «Скасувати замовлення» (Cancel order, outlined error) | «Підтвердити» (Approve, contained primary) + «Відхилити» (Reject, outlined error) |
| 2 | approved | «Підтверджено» · Approved | `info.light` | «Скасувати замовлення» | «Почати готування» (Start cooking, contained primary) + «Відхилити» |
| 3 | cooking | «Готується» · Cooking | `warning.light` | Cancel button VISIBLE but DISABLED, label «Скасувати — недоступно» (Cancel — unavailable); helper «Скасування вимкнено, щойно почалося готування.» (Cancelling is disabled once cooking has started.) | «Позначити приготованим» (Mark as prepared, contained success) |
| 4 | prepared | «Приготовано» · Prepared | `success.light` | no buttons; helper «Без кнопок — порції резервуються автоматично з партії.» (No buttons — portions are reserved automatically from the batch.) | ~~«Зарезервувати за замовником» (Reserve for the requester, contained secondary)~~ **superseded — see below**; meta shows batch code |
| 5 | reserved | «Зарезервовано» · Reserved | `secondary.light` | «Скасувати замовлення» | «Позначити спожитим» (Mark as consumed, contained success) + «Скасувати» (Cancel, outlined neutral) |

> **Implementation note (`mvp-audit-remediation`, Slice 5).** Row 4's admin
> "reserve for requester" action remains **superseded** by the resolved
> decision recorded in `admin-orders.md` — not built as a distinct button.
> Row 5 (`reserved`) is what shipped: an admin can Mark-consumed and Cancel a
> `reserved` order directly, as this matrix already specifies. The prepared
> row's admin meta shows a stable, human-readable **batch code** derived from
> the batch document id (e.g. a 4-character upper-case suffix), not a
> sequential number — real sequential batch numbering is deferred to a
> forthcoming `batch-sequence-number` specification (a Firestore schema/
> counter change out of this remediation's scope).
| 6 | consumed | «Спожито» · Consumed | default grey filled | no buttons; identical for both roles; lives in the History tab; card slightly dimmed, meta includes consumption time «спожито 13:40» | same |
| 7 | rejected | «Відхилено» · Rejected | `error.light` | no buttons; reason box shown if provided: «Причина: не вистачає борошна до суботи» (Reason: not enough flour until Saturday) — visible to the requester | same, no buttons |
| 8 | cancelled | «Скасовано» · Cancelled | default outlined (dashed card border, dimmed) | no buttons; meta «Скасовано користувачем» (Cancelled by the user); helper: portions return to the batch; History tab | same |

## BatchCard status matrix (05d)

Card: dish name, cooked date/time + «придатна до …» (usable until …), status
chip, 4 counter tiles «ВІЛЬНО / РЕЗЕРВ / СПОЖИТО / УТИЛІЗ.»
(FREE / RESERVED / CONSUMED / DISCARDED), discard button.

| # | Status | Chip (uk · en) | Palette | Card treatment | Discard action |
| --- | --- | --- | --- | --- | --- |
| 1 | fresh | «Свіжа» · Fresh | `success` | normal card | «Утилізувати…» outlined neutral, enabled |
| 2 | expiring soon | «⏳ Зіпсується за 4 год» · Spoils in 4 h | `warning` | warning-tinted bg + `warning`-tone border | «Утилізувати…» outlined warning, enabled |
| 3 | expired | «⚠ Прострочена» · Expired | `error` | error-tinted bg/border; body «Резервування заблоковано. 3 порції очікують утилізації.» (Reserving is blocked. 3 portions await discarding.) | «Утилізувати 3 порції» contained error |
| 4 | fully reserved | «Повністю зарезервована» · Fully reserved | `secondary` | secondary-tone border | button DISABLED, label «Утилізувати — усі порції зарезервовані» (Discard — all portions are reserved) |
| 5 | discarded | «Утилізована» · Discarded | default outlined chip, dashed border, dimmed | read-only; meta «Утилізовано Вт 8 · Ігор · 3 порції»; helper «Без кнопок · залишається в журналі руху.» (No buttons · stays in the movement log.) | none |

## All 8 dialogs (05e)

Modal `Dialog` on md+, bottom sheet on mobile («Модальні на md+, bottom-sheet
на мобільному»). Radius 22, e8 elevation. Confirmation dialogs are centered
with a 44px round icon badge. Cancel/secondary button is always outlined
neutral on the left; primary/destructive on the right (wider flex).

1. **Reservation confirm** — title «Зарезервувати порції» (Reserve portions)
   + meal tag chip; subtitle «Грибне різото · Ср 9 · вільно 4 порції».
   Fields: portion stepper (− / count / +; "+" disabled at max, error
   «Максимум 4 — стільки вільних порцій у партії»), optional note
   «Нотатка (необов'язково)» with placeholder «Менше солі, будь ласка»
   (Less salt, please). Buttons: «Скасувати» (Cancel) / «Зарезервувати»
   (Reserve, contained primary).
2. **Cooking request** — title «Попросити приготувати» (Ask to cook);
   subtitle «Томатний суп · усі інгредієнти в наявності» (all ingredients in
   stock). Fields: Дата (date, error «Дата не може бути в минулому»),
   Прийом їжі (meal select), portion stepper. Buttons: «Скасувати» /
   «Надіслати запит» (Send request) — primary DISABLED while invalid.
3. **Rejection (reason optional)** — title «Відхилити запит?» (Reject the
   request?); subtitle «Млинці · Ігор · 3 порції · Пт 11». Field: «Причина
   (необов'язково)» (Reason, optional) multiline; helper «Причину побачить
   автор запиту.» (The requester will see the reason.) Buttons: «Назад»
   (Back) / «Відхилити» (Reject, contained error).
4. **Stock correction (reason REQUIRED)** — title «Коригування залишку»
   (Stock correction); subtitle «Гриби · зараз 120 г» (Mushrooms · currently
   120 g). Fields: «Нова кількість» (New quantity) with unit suffix «г»;
   «Причина *» multiline, placeholder «Опишіть, чому змінюється залишок…»
   (Describe why the stock changes…), error «Вкажіть причину — поле
   обов'язкове»; helper «Запис додається до незмінного журналу руху.»
   (The entry is appended to the immutable movement log.) Buttons:
   «Скасувати» / «Зберегти» (Save) — DISABLED until reason filled.
5. **Batch registration (planned vs actual)** — title «Партію приготовано»
   (Batch cooked); subtitle «Томатний суп · запит Олени». Fields:
   «Планово, порцій» (Planned, portions — read-only), «Фактично *»
   (Actual — required), helper when actual < planned: «Фактичний вихід
   менший за плановий — інвентар спишеться за фактом.» (Actual yield is
   below plan — inventory is deducted by actuals.); «Придатна до *»
   (Usable until — datetime, error «Термін придатності не може бути в
   минулому»). Buttons: «Скасувати» / «Зареєструвати партію» (Register the
   batch, contained success).
6. **Batch discard (destructive confirm)** — "!" badge on `error.light`;
   title «Утилізувати партію?» (Discard the batch?); body «Запечений лосось ·
   3 вільні порції буде списано назавжди. Дію не можна скасувати.» (3 free
   portions will be written off forever. This cannot be undone.) Buttons:
   «Залишити» (Keep) / «Утилізувати» (Discard, contained error).
7. **Dish archive** — folder badge on `warning.light`; title «Архівувати
   страву?» (Archive the dish?); body «"Запечений лосось" зникне з меню,
   історія збережеться. Можна відновити з архіву.» (…will disappear from the
   menu, history is kept. Can be restored from the archive.) Buttons:
   «Залишити» (Keep) / «В архів» (To archive, contained `warning`).
8. **Order cancel** — "!" badge on `error.light`; title «Скасувати
   замовлення?» (Cancel the order?); body «2 зарезервовані порції "Грибного
   різото" повернуться в спільну партію.» (2 reserved portions return to the
   shared batch.) Buttons: «Залишити» (Keep) / «Скасувати замовлення»
   (Cancel order, contained error).

## Generic 4-data-state pattern (05g)

Every list screen has exactly 4 states; CatArt sizes: ~70×63 inline loading,
~88×80 empty/error.

- **Loading** — CatArt `sleep` above 2 skeleton cards; caption per screen:
  «Завантажуємо меню…», «Завантажуємо замовлення…», «Рахуємо порції…»
  (dashboard), «Перелічуємо запаси…» (inventory), generic «Завантаження…».
- **Empty** — CatArt `empty` (empty bowl), bold headline + one-line body +
  single CTA. Exact copies live in each screen file. Dashboard empty uses
  CatArt `idle` instead («Усе спокійно» — All calm; no CTA).

> **Implementation note (`mvp-audit-remediation`, Slice 3).** Shipped:
> `StatePlaceholder` now supports the `idle` pose and the dashboard's "all
> calm" empty state renders it, matching this row.
- **Error** — CatArt `confused`, headline (e.g. «Не вдалося завантажити» —
  Failed to load), body («Перевірте з'єднання і спробуйте ще раз.» — Check
  the connection and try again.), outlined retry button «Повторити» (Retry).
- **Populated** — the normal list.

Login has its own four: default / validation error / submitting («Вхід…» +
spinner, fields disabled) / server error banner «Невірна пошта або пароль».

## Edge-case rules (05h)

- **Long dish name** — clamp to 2 lines with ellipsis
  (`-webkit-line-clamp: 2`); the status chip never shrinks (`flex: none`).
- **20+ items** — alphabetical order, list virtualization, bottom fade with
  «…ще 17» (…17 more). Search appears from 10 items; sticky letter group
  headers from 20.
- **Zero quantity** — "0" is never hidden: show «0 г — закінчилися»
  (0 g — ran out) in `error.main` with chip «Немає» (Out) and a Restock CTA;
  dependent dishes flip to «Недоступно» (Unavailable).
- **Today, but meal time passed** — the past meal row is greyed with an
  outlined «Минув» (Passed) chip; copy «Зараз 14:20 — резервування на цей
  прийом закрито. Вечеря о 19:00 ще доступна.»; Reserve is disabled and the
  CTA «До вечері →» (To dinner →) points to the next available meal.
- **Expired batch on menu** — admin-only banner in `error` tones:
  «Партія від Пн 7 прострочена — страва прихована з меню, порції чекають
  утилізації в "Партіях".» with CTA «До партій →»; regular users simply do
  not see the dish.

## Responsive rules (05i, 06b)

- Mobile-first. Cards flow into a responsive grid; same tokens on every
  viewport.
- Navigation (`navigation-drawer-signout`): the left Drawer is the single
  navigation surface on all viewports — persistent at `md`+ (unchanged from
  before), and a temporary hamburger-triggered overlay below `md`, superseding
  the earlier BottomNavigation model described below. Every role destination
  is reachable from the drawer on mobile; there is no separate mobile-only
  navigation surface or admin dashboard hub link block.
- Dialogs: bottom sheet on mobile → centered modal on md+.
- Admin orders Kanban: horizontal column scroll on mobile, full 4 columns
  («Очікує / Підтверджено / Готується / Приготовано») on desktop.
- Drawer destinations (admin, same set on every viewport): Панель (Dashboard),
  Запити на готування (with count badge), Страви (Dishes), Інвентар
  (Inventory, with low-stock badge), Партії (Batches), Налаштування
  (Settings).
- **Superseded historical context.** Earlier mobile navigation used a
  BottomNavigation with 3 slots (Меню / Замовлення / Адмін); the third slot
  for admins was a dedicated «Адмін · Admin» tab leading to the admin area,
  and a larger admin destination set beyond the 3 slots was reachable only
  through a dashboard hub links block. Both the BottomNavigation and the hub
  links block are removed; `navigation-drawer-signout` is the current
  navigation model.
- User cooking requests are NOT a separate nav destination: they live inside
  My Orders (`/orders`); there is no `/requests` route. Request creation
  starts from a dish card in Menu browse (resolved decision — see
  `cooking-request.md`, `my-orders.md`).
- Touch targets ≥ 44px; layout must fit the longer of the uk/en strings.
  Longest pairs to test: «Можна приготувати»/"Can be cooked", «Повністю
  зарезервована»/"Fully reserved", «Запит на готування»/"Cooking request",
  «Позначити приготованим»/"Mark as prepared".

## Dark theme rules (06)

- Same palette slots, re-toned: brand colors lighten so contained buttons
  keep contrast on dark surfaces (`primary.main`, `secondary.main`,
  `success`, `warning`, `error`, `info` all get lighter dark-mode values;
  `background.default`/`background.paper` become near-black plum surfaces;
  `text.primary`/`text.secondary` become light).
- Illustrations (CatArt) use flat pastels legible on both themes; logo mark
  swaps to the dark-mode `primary.main`.
- Layouts are identical to light; only tokens change (coverage table marks
  most screens «токени 06» — theme handled purely by token remap; only Menu,
  Kanban, and Batches have dedicated dark mockups).

## Coverage table (05j) — transcribed

11 screens × 6 dimensions; «н/д» = dimension not applicable per spec scope
(responsive + dark are detailed only for the 3 most complex screens).

| Screen | 4 data states | Statuses | Dialogs | Validation | Responsive | Dark |
| --- | --- | --- | --- | --- | --- | --- |
| Вхід · Login | ✅ 05g·1 | ✅ n/a | ✅ n/a | ✅ email format | ✅ n/a | ✅ n/a |
| Меню · Menu browse | ✅ 05g·2 | ✅ chip ×4 | ✅ reserve (05e·1) | ✅ max portions | ✅ 05i | ✅ 05i |
| Резервування · Reservation | ✅ 05g·3 | ✅ n/a | ✅ 05e·1,8 | ✅ max/taken | ✅ sheet→modal | ✅ tokens 06 |
| Мої замовлення · My orders | ✅ 05g·4 | ✅ 8 statuses (05d) | ✅ cancel (05e·8) | ✅ n/a | ✅ n/a | ✅ tokens 06 |
| Запити на готування (user) | ✅ 05g·5 | ✅ pending/rejected | ✅ create (05e·2) | ✅ date in past | ✅ n/a | ✅ tokens 06 |
| Панель адміна · Dashboard | ✅ 05g·6 | ✅ attention tiles | ✅ n/a | ✅ n/a | ✅ 06b | ✅ 06 |
| Замовлення (Kanban, адмін) | ✅ 05g·7 | ✅ 8 + admin view (05d) | ✅ rejection (05e·3) | ✅ reason opt | ✅ 05i | ✅ 05i |
| Партії · Batches | ✅ 05g·8 | ✅ 5 statuses (05d) | ✅ register+discard (05e·5,6) | ✅ expiry in past | ✅ 05i | ✅ 05i |
| Інвентар · Inventory | ✅ 05g·9 | ✅ in/low/out + 0 (05h) | ✅ correction (05e·4) | ✅ reason required | ✅ n/a | ✅ tokens 06 |
| Страви · Dishes (admin) | ✅ 05g·10 + 05c | ✅ chip ×4 (05c) | ✅ archive (05e·7) | ✅ required, min/max | ✅ drawer+More (05c) | ✅ tokens 06 |
| Налаштування · Settings | ✅ 05g·11 | ✅ defaults/saved | ✅ n/a | ✅ time, submit | ✅ n/a | ✅ tokens 06 |
