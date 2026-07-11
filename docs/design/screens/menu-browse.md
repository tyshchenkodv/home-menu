# Menu browse (+ reservation confirmation flow)

Route: `/menu` · Audience: user (household member)

Transcribed from `design/home-menu-kitchen-inventory-app/Home Menu.dc.html`:
"05 Screens · Member" (Menu, Order dialog), "05e Dialogs" (dialog 1),
"05g Data states" (2 · Menu browse, 3 · Reservation flow), "05h Edge data",
"05i Responsive & dark" (Menu), "06 Dark theme" (Menu dark), "06b Desktop".

## Layout

### Mobile (< md)

Top to bottom:

1. App header (`background.paper`, bottom `divider` border): CatArt `logo`
   (`primary.main`) + wordmark «Home Menu» in `primary.dark`; right side —
   `UA | EN` language pill (active segment `primary` contained).
2. Horizontally scrollable **date selector** row: pill-cards per day, each
   with weekday overline (e.g. `WED` / uk `СР`) and large day number.
   Selected day = `primary.main` contained with white text and rose shadow;
   other days = `background.paper` card with `divider` border,
   `text.secondary` weekday, `text.primary` number.
3. **Meal tabs** (Breakfast / Lunch / Dinner — uk «Сніданок / Обід /
   Вечеря») as text tabs with a 2.5px `primary.main` underline indicator on
   the active tab; active label `primary.dark`, inactive `text.secondary`.
4. Scrollable list of **DishCard**s.
5. Bottom navigation (`background.paper`, top `divider` border, soft top
   shadow): items Menu («Меню»), Orders («Замовлення»), and Admin
   («Адмін») for admins only (resolved decision: dedicated Admin tab, not
   the «Більше»/More sheet — see `shared-patterns.md`). Active item
   `primary.main` (icon + bold label), inactive `text.disabled` grey. Menu
   is active here.

No FAB on this screen; the primary action lives inside each card.

### Desktop (≥ md, section 06b)

- Bottom navigation becomes a persistent left Drawer (~236px,
  `background.paper`-tinted rose surface, right `divider` border): logo +
  wordmark on top, nav items (active = `primary` contained rounded item with
  shadow; inactive plain `text.secondary`), and at the bottom the signed-in
  user name (`text.secondary`) + the `UA|EN` language pill.
- Content pane on `background.default`: page title h1 «Today's menu» / «Меню
  на сьогодні», with the date selector pills right-aligned in the same row;
  meal tabs below; dish cards flow into a responsive grid
  (`repeat(3, 1fr)` at desktop width; 2 columns on tablet).

### Dark theme (05i + 06)

Same layout, dark tokens: canvas `background.default` #1E1A1D-class, cards
`background.paper` #2A2329-class with dark dividers; `primary.main` lightens
(rose #F49CBF-class) and contained buttons flip to dark text on light-rose
fill; availability chips become translucent tints of their semantic color
(e.g. success chip = `success` text on ~18% alpha `success` background).
Disabled buttons: dark grey fill with muted text.

## States (05g · 2 — Menu browse)

- **loading** — small CatArt `sleep` centered above the list with caption
  «Завантажуємо меню…» / "Loading menu…" (`text.secondary`-muted, bold 700),
  followed by 2 skeleton cards (grey blocks for photo + two text lines).
  The full-page shared loading specimen uses the same pattern with caption
  «Loading menu…».
- **empty** (no dishes ready or cookable for the selected day/meal) — CatArt
  `empty`, headline «На цей день нічого немає» / "Nothing for this day",
  body «Жодна страва не готова й не може бути приготована. Загляньте на
  інший день.» / "No dish is ready or can be cooked. Try another day.",
  outlined `primary` CTA «Інший день» / "Another day".
- **error** — CatArt `confused`, headline «Не вдалося завантажити» /
  "Couldn't load", body «Перевірте з'єднання і спробуйте ще раз.» / "Check
  your connection and try again.", outlined CTA «Повторити» / "Retry".
  (Shared full-page error specimen: "Something went wrong" / "We couldn't
  load the menu. Check your connection and try again." + Retry.)
- **populated** — list/grid of DishCards, see below.

## Components

### DishCard

Card (radius 18, `divider` border, soft rose shadow) with:

- Optional photo strip on top (h ~80–96) with the availability chip overlaid
  top-right; cards without photo place the chip inline right of the title.
- Title h4 (Nunito 800). Long names clamp to **2 lines with ellipsis**
  (`-webkit-line-clamp: 2`); the chip is `flex: none` and never shrinks
  (edge case 05h).
- Description line, `text.secondary` body2 (e.g. "All ingredients in stock ·
  ~30 min"). Resolved decision: the dish's optional description (the
  uk + en field pair from the dish form, `admin-dishes.md`) is shown here,
  under the dish name; omitted when empty.
- Footer row: portions counter on the left, action button on the right.

Availability chip → footer/action mapping (all four states, from 05d
DishChip and 06b desktop grid):

| Availability | Chip (bg/text) | Chip label uk / en | Counter | Action |
| --- | --- | --- | --- | --- |
| Ready now | `success` light tint / `success.dark`, dot `success.main` | «Готово зараз» / "Ready now" | «4 вільно» / "4 ready" in `primary.dark` | contained `primary` «Зарезервувати» / "Reserve" |
| Can be cooked | `warning` light tint / `warning.dark`, dot `warning.main` | «Можна приготувати» / "Can be cooked" | «0 готово» / "0 ready" in `text.secondary` | contained `secondary` «Запит» / "Request" (opens cooking-request dialog, see `cooking-request.md`) |
| Unavailable | grey tint / grey text, grey dot | «Недоступно» / "Unavailable" | «—» | disabled «Запит» / "Request" button (grey fill, `text.disabled`); description may list missing ingredients ("Missing salmon fillet & dill.") |
| Not configured | `secondary` light tint / `secondary.dark`, dot `secondary.main` | «Не налаштовано» / "Not configured" | «—» | disabled button; description "Recipe not configured yet." (Normally hidden from users — this state appears in admin dish list; desktop mockup shows it greyed.) |

Status is never conveyed by color alone: every chip carries a colored dot +
text label.

**Implementation note — own-holdings hint**
(`docs/specifications/menu-own-reservation-hint/SPEC.md`): under the
portions counter, `DishAvailabilityCard` renders up to two additional
`text.secondary` info lines showing the signed-in user's own outstanding
holdings for that exact dish + the currently selected calendar day + meal
(never other members' orders): «Вже зарезервовано: {{count}}» / "Already
reserved: {{count}}" when the user holds one or more `reserved` ready orders
for the slot, and «Запит на готування: {{count}}» / "Cooking requested:
{{count}}" when the user has one or more active (non-terminal) cooking
requests for the slot. Each line renders only when its count is `> 0`;
switching the selected day or meal recomputes and can clear the hint. The
counter and Reserve/Request action are unchanged — the hint is additive and
does not block re-reserving up to availability.

## Edge cases (05h)

- **Long dish name**: max 2 lines then ellipsis; chip never compresses.
- **Today with past meal time**: a meal whose default time already passed
  (e.g. «Обід · сьогодні 13:00», now 14:20) shows an **outlined grey chip
  «Минув»** / "Passed"; explanation body «Зараз 14:20 — резервування на цей
  прийом закрито. Вечеря о 19:00 ще доступна.» / "It's 14:20 — reservations
  for this meal are closed. Dinner at 19:00 is still available."; the
  Reserve button is disabled and a secondary outlined CTA «До вечері →» /
  "To dinner →" jumps to the next available meal. Past meals today are
  greyed.
- **Expired batch behind a dish**: users simply do not see the dish. Admins
  see an `error`-tinted banner card: title in `error.dark`, chip «⚠
  Прострочено» / "⚠ Expired", body «Партія від Пн 7 прострочена — страва
  прихована з меню, порції чекають утилізації в „Партіях".» / "The batch
  from Mon 7 has expired — the dish is hidden from the menu; portions await
  discarding in Batches.", contained `error` CTA «До партій →» / "To batches
  →".

> **Implementation note (`menu-expired-batch-banner`).** The admin-only
> expired-batch banner is implemented
> (`src/features/menu/components/ExpiredBatchBanner/ExpiredBatchBanner.tsx`),
> fed by `src/domain/menu/selectExpiredBackingBatches.ts` over the batch data
> already subscribed in `useDishAvailability`, and gated in `MenuPage` to
> `profile?.role === 'admin' && profile.active`. **Scope caveat:**
> availability is intentionally unchanged — an expired, non-discarded batch's
> `availableQuantity` still counts toward the dish's readiness exactly as
> before, so the dish is **not** hidden from users; only the admin banner is
> new. The "users simply do not see the dish" line above describes a future
> business-rule change (excluding expired batches from availability), tracked
> as a separate, not-yet-approved specification.
- **20+ items**: alphabetical order, list virtualization; search appears
  from 10 items, sticky letter group headers from 20 (rule stated on the
  inventory edge-case card; apply to long lists generally).

## Actions and dialogs

### Reservation confirmation (dialog 05e·1; bottom sheet on mobile, modal on md+)

Trigger: «Зарезервувати» / "Reserve" on a Ready-now DishCard.

Mobile presentation: bottom sheet over a dimmed scrim (`rgba(58,30,42,0.42)`)
with a drag-handle bar at top; radius 26 top corners. Desktop: centered
modal (elevation e8).

Contents:

- Title row: h3 «Зарезервувати порції» (EN specimen title: "Reserve") + meal
  category tag chip (e.g. «Обід» / "Lunch" in the meal's pastel tint).
- Subtitle `text.secondary`: «Грибне різото · Ср 9 · вільно 4 порції» /
  "Mushroom risotto · Wed 9 · 4 portions ready".
- **Portions stepper**: label «Кількість порцій» / "Portions"; `−` button
  (outlined, `primary.dark` glyph), big count (Nunito 900), `+` button
  (contained `primary`). Right-aligned helper in `secondary.main`: «2 of 4
  left». When the count reaches the available maximum the `+` button becomes
  disabled (grey fill) and an `error` helper appears: «Максимум 4 — стільки
  вільних порцій у партії» / "Maximum 4 — that's how many free portions the
  batch has".
- Button row: outlined neutral «Скасувати» / "Cancel" (flex 1) + contained
  `primary` «Зарезервувати» (EN "Confirm reservation") (flex ~1.6).
  Cancel/scrim-tap dismisses without mutation.

Mutation: Firestore transaction reserving N portions from the batch; creates
an order in `reserved` status.

### Reservation flow states (05g · 3)

- **loading** — sheet skeleton: handle + grey bars for title/subtitle and
  two control rows.
- **empty (portions taken)** — CatArt `empty` inside the sheet, headline
  «Вільних порцій не залишилось» / "No free portions left", body «Щойно всі
  розібрали. Можна надіслати запит на готування.» / "They were just all
  taken. You can send a cooking request.", contained `secondary` CTA «Запит
  на готування» / "Cooking request".
- **error (race lost on confirm)** — CatArt `confused`, headline «Не вдалося
  зарезервувати» / "Couldn't reserve", body «Хтось випередив — залишилась 1
  порція з 2 потрібних.» / "Someone was faster — 1 portion left of the 2
  requested.", outlined CTA «Оновити наявність» / "Refresh availability".
- **populated** — the normal stepper + confirm form.

## Validation

| Field | Rule | Error copy (uk / en) |
| --- | --- | --- |
| Portions | min 1; max = free portions in batch | «Максимум N — стільки вільних порцій у партії» / "Maximum N — that's how many free portions the batch has"; `+` disabled at max |

Confirm button follows the 05f submit pattern: disabled while invalid;
submitting shows spinner + blocked re-click.

## Accessibility

- Touch targets ≥ 44px (stepper buttons 38–40px in the mockup are the
  minimum; do not go smaller).
- Chips: dot + label, never color alone.
- Bottom sheet: focus trap, drag handle, scrim tap = cancel.

## Resolved decisions

- **Dish description**: the optional dish description (uk + en, both
  optional, edited in the dish form) is displayed under the dish name on
  the DishCard.
- **Cooking-request entry point**: request creation starts from a dish card
  here (the «Запит» / "Request" button on a "Can be cooked" card) — this is
  the only entry point; there is no separate `/requests` route (requests
  live inside My Orders, see `cooking-request.md`).
- **No Note field**: the reservation dialog has no optional note/comment
  field — the `orders/{orderId}` data model (`docs/03-data-model.md`) has
  no note field, so the mockup's «Нотатка (необов'язково)» / "Note
  (optional)" field was not built. Treat it as a non-MVP idea.

## Open questions

- Whether reserving from a Ready-now card ever needs a date/meal selector in
  the dialog (mockup pre-fills the browsed day+meal and shows them read-only
  in the subtitle) — assumed read-only.
- The mobile date selector shows 4 upcoming days (WED 9 … SAT 12); the
  allowed browsing range (how far ahead) is not specified.
- «2 of 4 left» helper semantics (remaining after current selection) is
  inferred from the English specimen; UA copy for it is not shown in the
  mockup.
