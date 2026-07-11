# Prepared batches

Route: `/admin/batches` · Audience: admin

Source: `design/home-menu-kitchen-inventory-app/Home Menu.dc.html` — mobile
mockup "Prepared batches" (Administrator section), BatchCard status matrix
("05d Status matrices", 5 statuses), dialogs 5 and 6 ("05e Dialogs"),
data-state row "8 · Партії · Batches", edge case "Прострочена партія в меню",
and the "Responsive & dark" Batches set (mobile/desktop × light/dark).

## Layout

- **Mobile (< `md`)**: app bar title uk "Партії" (en "Prepared batches");
  vertical list of BatchCards; bottom navigation shell.
- **Desktop (≥ `md`)**: persistent drawer; batches in a **table-like grid**
  (caption "desktop · light · таблична сітка") — row per batch: dish name,
  status chip, meta (e.g. uk "Вт 8 · 18:00 · вільно 2", uk "6 з 6 у резерві"),
  action (e.g. uk "Утилізувати 3 порції").
- **Dark theme**: both breakpoints mocked; same structure on the dark scheme.
- **Primary action**: batch creation is NOT a button on this screen — batches
  are registered via the batch registration dialog triggered from
  "Mark prepared" on `/admin/orders` (empty-state copy confirms this).
  Per-card contextual "Discard…" buttons are the on-screen actions.

## States

From data-state row "8 · Партії · Batches":

- **Loading**: CatArt `sleep` + skeletons; caption uk "Завантаження…"
  (en "Loading…").
- **Empty**: CatArt `empty`. Title: uk "Немає готових партій" (en "No prepared
  batches"). Body: uk "Партія з'явиться, щойно ви позначите запит
  приготованим." (en "A batch will appear as soon as you mark a request as
  prepared."). No CTA.
- **Error**: CatArt `confused`. Title: uk "Не вдалося завантажити" (en
  "Couldn't load"). Body: uk "Спробуйте ще раз." (en "Try again."). Button:
  uk "Повторити" (en "Retry").
- **Populated**: cards as below.

## Components

### BatchCard

Header: dish name (h4), meta line "cooked day · time" (e.g. en "Cooked Wed 9 ·
10:30", uk "Ср 9 · 10:30 · придатна до Пт 11" — includes best-before on the
fresh card), status Chip top-right.

**Counters strip** — 4 equal cells, always all four, "0" shown explicitly:

| Cell | uk label | en label (mockup) | Cell tint |
| --- | --- | --- | --- |
| Available | ВІЛЬНО | AVAIL | success.light bg / success.dark number |
| Reserved | РЕЗЕРВ | RESV | primary.light-tinted bg / primary.dark number (secondary.light/dark when fully reserved) |
| Consumed | СПОЖИТО | USED | grey bg / text.secondary number |
| Discarded | УТИЛІЗ. | DISC | grey bg / text.secondary number |

**5 statuses** (exact chips and actions):

| # | Status | Chip label uk (en) | Chip color slot | Card styling | Action |
| --- | --- | --- | --- | --- | --- |
| 1 | fresh | «Свіжа» (Fresh) | success.light bg / success.dark text | plain Paper | outlined neutral button uk "Утилізувати…" (Discard…) |
| 2 | expiring soon | «⏳ Зіпсується за 4 год» (en "⏳ Expires in 4h") | warning.light bg / warning.dark text | warning-tinted card bg and warning border | outlined warning button uk "Утилізувати…" |
| 3 | expired | «⚠ Прострочена» (⚠ Expired) | error.light bg / error.dark text | error-tinted card, dish name in error.dark, meta e.g. uk "Пн 7 · термін минув учора" / en "Cooked Mon 7 · expired" | inline warning text uk "Резервування заблоковано. 3 порції очікують утилізації." (Reserving is blocked. 3 portions await disposal.) + contained error button uk "Утилізувати 3 порції" (en "Discard 3 portions"); counters strip replaced by this notice on the mockup |
| 4 | fully reserved | «Повністю зарезервована» (Fully reserved) | secondary.light bg / secondary.dark text | secondary-tinted border | discard button **visible but disabled**, label uk "Утилізувати — усі порції зарезервовані" (Discard — all portions are reserved) |
| 5 | discarded | «Утилізована» (Discarded) | default chip, outlined | muted card, dashed border, opacity reduced | none — read-only; meta uk "Утилізовано Вт 8 · Ігор · 3 порції"; helper uk "Без кнопок · залишається в журналі руху." (stays in the movement log) |

Expiring/expired chips include the ⏳/⚠ glyph so status is not color-only.

## Actions and dialogs

### Batch registration dialog (dialog 5 — planned vs actual yield)

Trigger: "Mark prepared" ("Позначити приготованим") on a cooking order
(`/admin/orders`).

- Title: uk "Партію приготовано" (en "Batch prepared").
- Context: uk "Томатний суп · запит Олени" (dish · requester).
- Fields (two-column row + date):
  1. uk "Планово, порцій" (Planned, portions) — **read-only**, greyed input
     (prefilled from the request, e.g. 8).
  2. uk "Фактично *" (Actual *) — required number input (e.g. 6).
  3. uk "Придатна до *" (Best before *) — required date+time,
     e.g. "09.07.2026 · 18:00".
- Helper when actual < planned (warning.dark tone): uk "Фактичний вихід менший
  за плановий — інвентар спишеться за фактом." (Actual yield is lower than
  planned — inventory is deducted by the actual amount.)
- Validation error under the date: uk "Термін придатності не може бути в
  минулому" (The expiration date cannot be in the past) — error-bordered field.
- Buttons: outlined neutral uk "Скасувати" (Cancel) · contained **success**
  uk "Зареєструвати партію" (Register batch).

### Discard confirmation (dialog 6 — destructive)

Trigger: any enabled "Утилізувати…" / "Утилізувати N порцій" button.

- Centered "!" icon in an error.light circle (error.dark glyph).
- Title: uk "Утилізувати партію?" (en "Discard the batch?").
- Body: uk "Запечений лосось · 3 вільні порції буде списано назавжди. Дію не
  можна скасувати." (en "Baked salmon · 3 available portions will be written
  off permanently. This cannot be undone.")
- Buttons: outlined neutral uk "Залишити" (Keep) · contained error
  uk "Утилізувати" (Discard).
- Resulting mutation: available portions → discarded counter, batch status →
  discarded, entry appended to the movement log; must run in a Firestore
  transaction (project architecture rule for batch mutations).

Dialogs are centered modals on `md+`, bottom sheets on mobile.

## Validation

- "Фактично" (actual yield): required; numeric.
- "Придатна до" (best before): required; rule date-not-in-past with error
  uk "Термін придатності не може бути в минулому". (Generic date error
  elsewhere: uk "Дата не може бути в минулому".)
- Submit disabled while invalid; submitting state shows spinner + uk
  "Збереження…" and blocks repeat clicks (global form rules; errors appear on
  blur).

## Edge cases

- **Expired batch and the menu** (edge-case card): banner (admin-only) uk
  "Партія від Пн 7 прострочена — страва прихована з меню, порції чекають
  утилізації в «Партіях»." with link uk "До партій →"; users simply do not see
  the dish. Chip uk "⚠ Прострочено".
- Fully reserved batch cannot be discarded (disabled button with explanatory
  label).
- **Expired/discarded batch with reserved orders** (resolved decision): no
  automatic order mutation — affected orders stay `reserved`; a warning is
  shown on both the admin order card (`admin-orders.md`) and the user order
  card (`my-orders.md`); the admin resolves each order via the correction
  dialog (cancel the order or move it to another batch).
- Quantity 0 in any counter is always rendered, never hidden.
- Long dish names: 2-line clamp with ellipsis; the status chip does not shrink
  (global card rule).
- Same-day boundary: expiring chip shows remaining hours ("⏳ 4 год").

## Accessibility

- Every status has a text label (plus ⏳/⚠ glyphs); counters have text labels
  under each number.
- Disabled discard keeps a visible explanatory label.
- Card buttons are full-width (≥44px) on mobile.

## Resolved decisions

- **Batch expiry/discard under reserved orders**: no automatic mutation —
  orders stay `reserved` with a warning on both admin and user cards; the
  admin resolves via the correction dialog (cancel or move). See "Edge
  cases" above.
- **Partial discard is out of MVP scope**: the discard dialog always
  discards all available portions (accepted default).

## Open questions

- Can a batch be registered without a linked cooking request (ad-hoc
  cooking)? The mockup only shows registration from a request.
- Expired card on the mobile screen hides the counters strip; the matrix
  version shows a notice instead — confirm whether counters stay visible for
  expired batches.
- Whether discarded/old batches move to a separate history/filter view is not
  shown (discarded card note says it "stays in the movement log" only).
- Desktop grid: sorting/filtering controls are not mocked.
