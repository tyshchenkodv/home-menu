# Cooking request (user-side creation + list)

Route: none of its own — requests live inside My Orders (`/orders`); the
creation dialog opens from `/menu` · Audience: user

Resolved decision: there is NO separate `/requests` route or navigation
destination. Request cards render inside My Orders (`my-orders.md`), and
request creation starts from a dish in Menu browse. The list-screen
specimens below (05g·5) apply to how request cards appear within My Orders.

Transcribed from `design/home-menu-kitchen-inventory-app/Home Menu.dc.html`:
"05e Dialogs" (dialog 2 «Запит на готування»), "05g Data states" (5 · Мої
запити на готування · Cooking requests (user)), "05d Status matrices"
(pending/rejected rows), coverage table row "Запити на готування (user)".

## Layout

- **Creation dialog**: opened from a Menu DishCard in "Can be cooked" state
  via the contained `secondary` «Запит» / "Request" button. Bottom sheet on
  mobile, centered modal on md+ (05e rule: «Модальні на md+, bottom-sheet на
  мобільному»).
- **List presentation**: the mockup provides four data-state specimens
  (05g·5) rendered in the standard mobile shell. Cards follow the OrderCard
  pattern and live inside My Orders (`/orders`) per the resolved decision —
  reuse the shell and tabs from `my-orders.md`.
- The empty-state contained `secondary` «Створити запит» / "Create request"
  CTA navigates to Menu browse, where request creation starts from a dish
  card; no FAB is shown in the mockup.

## States (05g · 5 — user cooking-requests list)

- **loading** — CatArt `sleep` + caption «Завантаження…» / "Loading…", two
  skeleton cards.
- **empty** — CatArt `empty`, headline «Немає активних запитів» / "No active
  requests", body «Захотілося чогось, чого немає в готовому? Попросіть
  приготувати.» / "Craving something that isn't ready-made? Ask for it to be
  cooked.", contained `secondary` CTA «Створити запит» / "Create request".
- **error** — CatArt `confused`, headline «Не вдалося завантажити» /
  "Couldn't load", body «Спробуйте ще раз за мить.» / "Try again in a
  moment.", outlined CTA «Повторити» / "Retry".
- **populated** — request cards, e.g.:
  - «Томатний суп» with chip «Очікує» / "Pending" (`primary.light` tint bg,
    `primary.dark` text); meta «1 порція · Чт 10, обід» / "1 portion · Thu
    10, lunch".
  - «Млинці» with chip «Відхилено» / "Rejected" (`error.light` tint bg,
    `error.dark` text), card border `error`-tinted; reason line in
    `error.dark`: «Причина: не вистачає борошна» / "Reason: not enough
    flour".

Request lifecycle statuses and their card behavior (buttons, chip colors,
admin counterpart actions) follow the full OrderCard matrix documented in
`my-orders.md` — a cooking request is an order whose meta line reads «Запит»
/ "Cooking request". Cancellable while `pending`/`approved`; cancel disabled
once `cooking`.

## Components — creation dialog (05e · 2)

- Title h3: «Попросити приготувати» / "Ask to cook".
- Subtitle `text.secondary`: «Томатний суп · усі інгредієнти в наявності» /
  "Tomato soup · all ingredients in stock" (dish is pre-selected from the
  menu card).
- **Дата · Прийом їжі** / "Date · Meal": READ-ONLY context line, e.g.
  «08.07.2026 · Обід» / "Jul 8, 2026 · Lunch" (resolved decision — these are
  NOT editable fields; the request always inherits the date and meal the
  user already selected on the Menu screen, `menu-browse.md`, before opening
  this dialog). There is no in-dialog date picker, no meal select, and no
  "date cannot be in the past" validation here — that rule lives on the
  Menu screen's date selector, which never lets the user pick a past day.
- **Кількість порцій** / "Portions": stepper identical to the reservation
  sheet (`−` outlined, count Nunito 900, `+` contained `primary`), min 1.
- Button row: outlined neutral «Скасувати» / "Cancel" (flex 1) + submit
  «Надіслати запит» / "Send request" (flex ~1.6). While the form is invalid
  the submit is disabled (grey `action.disabledBackground`, `text.disabled`)
  — the mockup even annotates: «Кнопка вимкнена, поки є помилки валідації.»
  / "Button is disabled while validation errors exist." When valid it is a
  contained **`primary`** button (resolved decision — accepted default for
  the enabled submit color).
- Cancel behavior: Cancel button / scrim tap / Esc dismiss without mutation.

Mutation: creates a cooking request (order in `pending` status) for the
chosen dish, date, meal, and portion count. It then appears on the admin
Kanban «Очікує» column and in the user's list.

## Validation

| Field | Rule | Error copy (uk / en) |
| --- | --- | --- |
| Дата · Прийом їжі | read-only, inherited from the Menu screen's selection — no in-dialog validation | — |
| Кількість порцій | integer ≥ 1 (stepper cannot go below 1) | — (enforced by control) |

05f global rules apply: errors on blur; submit disabled while invalid;
submitting state = lightened fill + white spinner + label «Надсилання…»
pattern («Збереження…» / "Saving…" analog), re-click blocked.

## Accessibility

- Stepper buttons ≥ 38px (treat 44px as target on mobile).
- Status chips carry dot/label text, not color alone.
- Dialog focus trap; first focus on the portions stepper (the date/meal
  line is read-only, non-focusable context, not a field).

## Resolved decisions

- **Navigation placement**: user cooking requests live INSIDE My Orders —
  no separate `/requests` route or nav destination; request creation starts
  from a dish in Menu browse.
- **Submit button enabled color**: contained `primary` (accepted default).
- **Dialog is dish-bound**: because creation always starts from a dish card
  in Menu browse, the dialog keeps the pre-selected dish and needs no dish
  picker; the empty-state CTA navigates to the menu instead of opening a
  picker.
- **Date and meal are read-only context**: the dialog shows a single
  "`<date>` · `<meal>`" line inherited from the Menu screen's date+meal
  selection; there is no editable Date field, no Meal select, and no
  in-dialog "date cannot be in the past" validation — superseding the
  mockup's editable two-column Date/Meal row.

## Open questions
- Note/comment field: the reservation sheet has no note field either (see
  `menu-browse.md`); the cooking-request dialog matches — assumed absent.
