# Admin orders (cooking-requests Kanban)

Route: `/admin/orders` · Audience: admin

Source: `design/home-menu-kitchen-inventory-app/Home Menu.dc.html` — mobile
mockup "Admin orders" (screen header "Cooking requests", Administrator
section), OrderCard status matrix ("05d Status matrices"), dialogs 3 and 4
("05e Dialogs"), data-state row "7 · Замовлення (Kanban, адмін)", and the
"Responsive & dark" Kanban set (mobile/desktop × light/dark).

## Layout

- **Mobile (< `md`)**: app bar title uk "Запити на готування" (en "Cooking
  requests"). Kanban columns in a **horizontally scrolling** row (mockup
  caption: "mobile · light · горизонтальний скрол колонок"). Each column
  header: colored dot + column name + count, e.g. uk "Очікує · 2". Bottom
  navigation shell.
- **Desktop (≥ `md`)**: persistent drawer; **full 4 columns** side by side
  (caption "desktop · light · повні 4 колонки"): uk "● Очікує", "● Підтверджено",
  "● Готується", "● Приготовано" (en Pending, Approved, Cooking, Prepared),
  each with a count. Column dot colors: Pending → primary.main, Approved →
  info.main (Ukrainian desktop mock shows the approved column), Cooking →
  warning.main, Prepared → success.main.
- **Dark theme**: both breakpoints mocked; identical structure on the dark
  palette scheme.
- **Primary action**: contextual button on each card; no FAB, no header button.

Note: the English Administrator-section mobile mockup shows only Pending /
Cooking / Prepared columns (Approved omitted for space); the desktop mockups
show all four. Treat four columns as canonical.

**Board / History split (resolved decision)**: the Kanban keeps exactly 4
active columns (pending / approved / cooking / prepared). A "History"
("Історія") tab on the same screen shows terminal orders — `reserved`,
`consumed`, `rejected`, `cancelled` — as a status-filterable list (not
columns).

## States

From data-state row "7 · Замовлення (Kanban, адмін)":

- **Loading**: CatArt `sleep` + column skeletons (uk "Завантаження…" pattern).
- **Empty**: CatArt `empty`. Title: uk "Немає запитів" (en "No requests").
  Body: uk "Нових запитів на готування поки немає — дошка порожня."
  (en "No new cooking requests yet — the board is empty."). No CTA shown.
- **Error**: CatArt `confused`. Title: uk "Дошка не завантажилась" (en "The
  board didn't load"). Body: uk "Спробуйте оновити." (en "Try refreshing.").
  Button: uk "Повторити" (en "Retry").
- **Populated**: e.g. column "Очікує · 2" with cards "Томатний суп / Олена · 1 ·
  Чт" (button uk "Підтвердити" / en "Approve") and "Млинці / Ігор · 3 · Пт";
  column "Готується · 1" with "Різото / Олена · 2 · Ср"; prepared card
  "Омлет / партія #12".

## Components

### OrderCard (admin view) — 8 statuses, exact buttons and chip colors

Card body: dish name (h4), meta line "requester · portions · date"
(e.g. uk "Олена · 1 порція · Чт 10"), status Chip top-right, contextual
buttons below. Chip always has a text label (never color alone).

| # | Status | Chip label uk (en) | Chip color slot | Admin buttons |
| --- | --- | --- | --- | --- |
| 1 | `pending` | «Очікує» (Pending) | primary.light bg / primary.dark text | "Підтвердити" (Approve, contained primary) + "Відхилити" (Reject, outlined error) |
| 2 | `approved` | «Підтверджено» (Approved) | info.light bg / info.dark text | "Почати готування" (Start cooking, contained primary) + "Відхилити" (Reject, outlined error) |
| 3 | `cooking` | «Готується» (Cooking) | warning.light bg / warning.dark text | "Позначити приготованим" (Mark as prepared, contained success), full width |
| 4 | `prepared` | «Приготовано» (Prepared) | success.light bg / success.dark text | meta shows batch, e.g. "Олена · партія #14"; card is context-only — "Correct" (outlined/text, `orders.admin.actions.correct`) is the sole action, no "Reserve for the requester" button (resolved decision, below) |
| 5 | `reserved` | «Зарезервовано» (Reserved) | secondary.light bg / secondary.dark text | "Позначити спожитим" (Mark consumed, contained success) + "Скасувати" (Cancel, outlined neutral) |
| 6 | `consumed` | «Спожито» (Consumed) | default/grey chip | none — read-only, muted card; meta e.g. "2 порції · Ср 9 · спожито 13:40"; lives in a "History" ("Історія") tab; identical for user and admin |
| 7 | `rejected` | «Відхилено» (Rejected) | error.light bg / error.dark text | none; inline reason panel (error.light bg, error.dark text): uk "Причина: не вистачає борошна до суботи"; reason (if given) is visible to the requester |
| 8 | `cancelled` | «Скасовано» (Cancelled) | default chip, outlined | none — muted card with dashed border, meta uk "Скасовано користувачем · Пт 11"; portions return to the batch; "History" tab |

User-view differences (for reference, same matrix):

- `pending`/`approved`: single full-width outlined-error button
  uk "Скасувати замовлення" (Cancel order).
- `cooking`: the cancel button is **visible but disabled** — label
  uk "Скасувати — недоступно" with helper uk "Скасування вимкнено, щойно
  почалося готування." (cancellation is disabled once cooking starts).
- `prepared`: no buttons; helper uk "Без кнопок — порції резервуються
  автоматично з партії." (portions are reserved automatically from the batch).
- `reserved`: "Скасувати замовлення" enabled.

### Column header

Dot (8–9px circle, status color main slot) + bold column label (status dark
slot tone) + grey count.

## Actions and dialogs

- **Approve** ("Підтвердити"): `pending` → `approved`. No dialog shown.
- **Start cooking** ("Почати готування"): `approved` → `cooking`. No dialog
  shown.
- **Mark prepared** ("Позначити приготованим" / "Mark prepared"): `cooking` →
  `prepared`; opens the **batch registration dialog** (dialog 5, "Партію
  приготовано" — full transcription in `admin-batches.md`), which creates the
  prepared batch (planned vs actual yield, expiration) and links the order to
  it ("партія #N").
- **Prepared → reserved/consumed (automatic, no button)**: per
  `docs/04-business-logic.md` "Completing cooking", the batch-registration
  transaction that marks a request `prepared` ALSO reserves the requested
  quantity from that batch in the same transaction. There is no separate
  admin "Reserve for the requester" action — a prepared cooking-request
  order is already effectively reserved; the card shows only "Correct" for
  context/audit purposes. After `scheduledFor` passes, the order normalizes
  to `consumed` the same way any reservation does (see "Automatic
  consumption" in `docs/04-business-logic.md`), surfaced through the
  History tab.
- **Mark consumed** ("Позначити спожитим"): `reserved` → `consumed`.

> **Implementation note (`mvp-audit-remediation`, T5.8).** Shipped: an admin
> can Mark-consumed and Cancel a `reserved` order directly from its card
> (both buttons render on the `reserved` row), via a new
> `computeManualConsumption` domain function and `consumeOrder` transaction.
> These actions also appear in the History tab for a `reserved` order (not
> only in the active Kanban), matching the acceptance criterion that an admin
> can act on a reserved order wherever it's shown. Prepared/reserved admin
> meta shows a stable, human-readable **batch code** (a short id-derived
> string) rather than a literal "партія #N" sequential number — the real
> sequential batch number is carved out to a forthcoming
> `batch-sequence-number` specification (a Firestore schema/counter change),
> per the approved PLAN's scope decision.
- **Reject** ("Відхилити") — **rejection dialog, reason optional** (dialog 3):
  - Title: uk "Відхилити запит?" (en "Reject the request?").
  - Context line: e.g. uk "Млинці · Ігор · 3 порції · Пт 11".
  - Field: uk "Причина (необов'язково)" (Reason (optional)) — multiline text.
  - Helper: uk "Причину побачить автор запиту." (The requester will see the
    reason.)
  - Buttons: secondary outlined uk "Назад" (Back) · destructive contained
    error uk "Відхилити" (Reject).
- **Correction dialog — reason REQUIRED** (dialog 4; opened from Inventory’s
  "Correct" action, listed here per checklist item D):
  - Title: uk "Коригування залишку" (en "Stock correction").
  - Context: uk "Гриби · зараз 120 г" (current amount).
  - Field 1: uk "Нова кількість" (New quantity) with unit suffix "г".
  - Field 2: uk "Причина *" (Reason, required), placeholder uk "Опишіть, чому
    змінюється залишок…"; error text uk "Вкажіть причину — поле обов'язкове"
    (Provide a reason — the field is required).
  - Helper: uk "Запис додається до незмінного журналу руху." (The entry is
    appended to the immutable movement log.)
  - Buttons: uk "Скасувати" (Cancel) · uk "Зберегти" (Save) — Save is
    **disabled** while the reason is empty.
- Dialogs are centered modals on `md+`, bottom sheets on mobile (global rule).

## Validation

- Rejection reason: optional, no validation.
- Correction reason: required; error uk "Вкажіть причину — поле обов'язкове";
  submit disabled until valid.
- Global submit-button states: enabled contained primary; disabled (grey
  action-disabled bg, helper uk "disabled — поки форма невалідна"); submitting
  with spinner and label uk "Збереження…", repeat clicks blocked.

## Accessibility

- Status chips pair color with a text label; column headers pair dot + label +
  count.
- Disabled buttons keep visible labels explaining why (see cooking-status
  cancel).

## Resolved decisions

- **No "Reserve for the requester" button on Prepared cards**: per
  `docs/04-business-logic.md` "Completing cooking", the batch-registration
  transaction already reserves the requested quantity from the new batch
  when the request becomes `prepared`. A Prepared card is context-only —
  "Correct" is the sole action. The order normalizes to `consumed` after
  `scheduledFor` like any other reservation, surfaced via the History tab.
  This supersedes the EN mockup's "Reserve for the requester" button.
- **History tab**: `reserved`, `consumed`, `rejected`, and `cancelled` orders
  live in a "History" ("Історія") tab on this screen, shown as a
  status-filterable list; the Kanban keeps only the 4 active columns
  (pending / approved / cooking / prepared).
- **Batch expired/discarded under a reserved order**: no automatic order
  mutation. The order stays `reserved`; both the admin card (here) and the
  user card (`my-orders.md`) show a warning; the admin resolves it via the
  correction dialog (cancel the order or move it to another batch). See also
  `admin-batches.md`.

## Open questions

- Whether Approve/Start cooking need confirmation dialogs (none mocked).
- Whether cards support drag-and-drop between columns or only button-driven
  transitions (only buttons are mocked).
- Mobile English mock omits the Approved column; assumed a space-saving
  artifact, not a behavioral difference.
