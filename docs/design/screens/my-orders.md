# My orders

Route: `/orders` · Audience: user (household member)

Transcribed from `design/home-menu-kitchen-inventory-app/Home Menu.dc.html`:
"05 Screens · Member" (My Orders), "05 Shared states" (Empty, Confirm
dialog), "05d Status matrices" (OrderCard · 8 statuses), "05e Dialogs"
(dialog 8), "05g Data states" (4 · My orders).

## Layout

- Mobile: status bar → white header block with h1 «My Orders» / uk «Мої
  замовлення» and two text tabs **Active** / **History** («Активні» /
  «Історія»; mockup labels "Active"/"History") with 2.5px `primary.main`
  underline on the active tab → scrollable card list → bottom navigation
  (Orders item active in `primary.main`).
- The Active tab shows current orders; below them a section overline label
  «Earlier» / uk «Раніше» (uppercase, letter-spaced, muted rose) introduces
  recently finished items rendered as muted history cards.
- Desktop: coverage table marks responsive as "н/д" — reuse the app Drawer
  shell from `menu-browse.md` («My Orders» nav item active) with the same
  single-column list constrained in width (no dedicated grid specimen).
- Dark theme: no dedicated specimen; apply theme tokens ("токени 06") — dark
  paper cards, translucent chip tints, lightened brand colors.
- Primary action: none (no FAB); actions live per-card.

## States (05g · 4)

- **loading** — CatArt `sleep` + caption «Завантажуємо замовлення…» /
  "Loading orders…", followed by 2 skeleton cards (two grey text bars each).
- **empty** — CatArt `empty`, headline «Ще немає замовлень» / "No orders
  yet" (shared full-page specimen: "Nothing here yet"), body «Миска Котика
  порожня. Загляньте в меню й зарезервуйте страву.» / "Kotyk's bowl is
  empty. Browse today's menu to reserve a dish.", contained `primary` CTA
  «До меню» / "Browse menu".
- **error** — CatArt `confused`, headline «Щось пішло не так» / "Something
  went wrong", body «Не вдалося отримати ваші замовлення.» / "Couldn't fetch
  your orders.", outlined CTA «Повторити» / "Retry".
- **populated** — OrderCards, see status matrix below.

## Components

### OrderCard (user view) — all 8 statuses (05d matrix)

Card: radius 14–16, `divider` border, `background.paper`. Header row: dish
title h4 + meta line in `text.secondary` (source · portions · day, meal —
e.g. «Запит · 1 порція · Чт 10, обід» / "Cooking request · 1 portion · Thu
10, Lunch"; reservations read e.g. «2 порції · Ср 9, обід» / "Reserved · 2
portions · Wed 9, Lunch"). Status chip top-right. Optional full-width action
button below.

| # | Status | Chip label uk / en | Chip color (MUI slot) | User card actions | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | pending | «Очікує» / "Pending" | `primary.light` tint bg, `primary.dark` text | Full-width outlined `error` button «Скасувати замовлення» / "Cancel order" (visible, enabled) | Admin view differs: contained `primary` «Підтвердити»/"Approve" + outlined `error` «Відхилити»/"Reject" |
| 2 | approved | «Підтверджено» / "Approved" | `info.light` tint bg, `info.dark` text | «Скасувати замовлення» enabled | Admin: «Почати готування»/"Start cooking" + «Відхилити»/"Reject" |
| 3 | cooking | «Готується» / "Cooking" | `warning.light` tint bg, `warning.dark` text | Cancel button **visible but disabled**: grey outlined «Скасувати — недоступно» / "Cancel — not available" (mock also shows variant label «Cancel not allowed»), plus muted caption «Скасування вимкнено, щойно почалося готування.» / "Cancellation is disabled once cooking has started." | Admin: contained `success` «Позначити приготованим»/"Mark as prepared" |
| 4 | prepared | «Приготовано» / "Prepared" | `success.light` tint bg, `success.dark` text | **No buttons.** Caption: «Без кнопок — порції резервуються автоматично з партії.» / "No buttons — portions are reserved automatically from the batch." | Admin: contained `secondary` «Зарезервувати за замовником»/"Reserve for the requester"; admin meta shows batch ref («партія #14») |
| 5 | reserved | «Зарезервовано» / "Reserved" | `secondary.light` tint bg, `secondary.dark` text | «Скасувати замовлення» / "Cancel order" enabled (outlined `error`) | Admin: contained `success` «Позначити спожитим»/"Mark as consumed" + outlined neutral «Скасувати»/"Cancel" |
| 6 | consumed | «Спожито» / "Consumed" | grey/default tint bg, grey text | **No buttons.** Muted card (`background` slightly tinted, ~0.92 opacity, `text.secondary` title); meta includes consumption time «спожито 13:40» / "consumed 13:40" | Identical for user and admin; lives in the **History** tab («вкладка „Історія"»). Header list variant shows chip "Completed" for finished items under «Earlier» |
| 7 | rejected | «Відхилено» / "Rejected" | `error.light` tint bg, `error.dark` text | **No buttons.** If the admin gave a reason it is shown to the user in an `error`-tinted inset block: «Причина: не вистачає борошна до суботи» / "Reason: not enough flour before Saturday" | Reason is optional (rejection dialog) but visible when present |
| 8 | cancelled | «Скасовано» / "Cancelled" | outlined default chip: 1.5px grey border, grey text, no fill | **No buttons.** Muted card with dashed grey border; meta «Скасовано користувачем · Пт 11» / "Cancelled by user · Fri 11" | Portions return to the batch («Порції повертаються в партію»); History tab |

Cancellation rule summary: cancel is available in `pending`, `approved`, and
`reserved`; visible-but-disabled in `cooking`; absent everywhere else.
Consumed handling: consumed orders are read-only, greyed, and shown only in
History with the consumption timestamp.

## Actions and dialogs

### Cancel order confirmation (dialog 05e·8 / shared destructive confirm)

Trigger: «Скасувати замовлення» on a cancellable card. Centered modal
(mobile too — the shared confirm specimen is a centered dialog over the
dimmed scrim, not a bottom sheet):

- Round `error.light`-tinted icon badge with a bold `!` in `error.dark`.
- Title h3: «Скасувати замовлення?» / "Cancel this order?"
- Body: «2 зарезервовані порції „Грибного різото" повернуться в спільну
  партію.» / "Your reserved portions of Mushroom risotto will be released
  back to the household." (interpolate portion count + dish name).
- Buttons: outlined neutral «Залишити» / "Keep" (flex 1) + contained `error`
  «Скасувати замовлення» / "Cancel order" (flex ~1.3, destructive).
- Cancel behavior: «Залишити», scrim tap, or Esc closes with no mutation.

Mutation: transaction releasing reserved portions back to the batch and
setting order status `cancelled`.

### Tab switching

Active ↔ History; History contains `consumed`, `rejected`, `cancelled` (and
the muted "Completed" style shown under «Earlier»).

## Validation

N/A — the screen has no forms; the only input is the confirm dialog with no
fields.

## Accessibility

- Chip label always accompanies color; disabled cancel keeps explanatory
  caption text so the state is not conveyed by grey alone.
- Full-width card buttons ≥ 44px touch height.
- Confirm dialog: focus trap, initial focus on the non-destructive «Залишити»
  button recommended.

## Resolved decisions

- **Cooking requests live INSIDE My Orders**: there is no separate
  `/requests` route or navigation destination. A cooking request renders as
  an OrderCard here (meta line «Запит» / "Cooking request"); request
  creation starts from a dish in Menu browse (see `cooking-request.md`,
  `menu-browse.md`).
- **Batch expired/discarded under a reserved order**: no automatic order
  mutation — the order stays `reserved`, and the user card shows a warning
  that the underlying batch expired or was discarded. The admin resolves it
  via the correction dialog (cancel or move); see `admin-orders.md`,
  `admin-batches.md`.

## Open questions

- The overview mockup shows chip «Ready» on a reserved card and «Completed»
  under «Earlier», which do not match the canonical 8-status chip labels in
  05d; the 05d matrix is authoritative — treat «Ready»/"Completed" as early
  drafts.
- Whether History is paginated/limited (mockup shows only a handful of
  cards) is unspecified.
- Exact uk labels for the tabs («Активні» / «Історія») are inferred: the
  member screen shows the tabs only in English; 05d note references
  «вкладка „Історія"» confirming «Історія».
