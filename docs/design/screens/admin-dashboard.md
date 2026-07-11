# Admin dashboard

Route: `/admin` · Audience: admin

Source: `design/home-menu-kitchen-inventory-app/Home Menu.dc.html` — mobile mockup
"Admin dashboard" (Administrator section), desktop mockup in "Desktop & tablet"
(`home-menu.app / admin`), data-state row "6 · Панель адміна · Admin dashboard".

Note on mockup language: the Administrator-section mobile mockup and the
desktop mockup use English placeholder copy; the data-states section carries
the Ukrainian copy. Both are quoted below; all strings must exist in both `uk`
and `en` translation resources.

## Layout

- **Mobile (< `md`)**: app bar with an "Admin" overline (secondary-colored
  caption) above the "Dashboard" title, and a small CatArt `idle` mascot on the
  right. Bottom navigation with three items: "Menu" (uk "Меню"), "Orders"
  (uk "Замовлення"), "Admin" (uk "Адмін") active in primary color. Resolved
  decision: the dedicated "Admin" tab from the English mockups is canonical;
  the "Більше" / "More" bottom-sheet variant from the later Ukrainian
  navigation mockups is superseded. This amends the approved
  navigation-shell spec; a new linked spec will cover it.
- **Body (mobile)**, top to bottom:
  1. 2×2 grid of summary tiles (Paper cards, radius 16):
     - "3" / "Pending requests" — count in primary.main tone, border tinted
       primary.light.
     - "2" / "In progress" — count in warning.dark tone, border warning.light.
     - "5" / "Low-stock items" — count in error.dark tone, border error.light.
     - "1 ⚠" / "Expired batch" — count in error.dark tone, border error.light.
  2. Full-width success banner (success.light gradient background): big number
     "18", label "Portions ready to reserve", CatArt `idle` at the right.
  3. Overline section header "Quick actions" (uppercase, letter-spaced,
     text.secondary tone).
  4. Quick-action list rows (outlined Paper rows):
     - "Review cooking requests" with a badge chip "3" (primary.light bg,
       primary.dark text).
     - "Restock ingredients" with a chevron "›".
- **Desktop (≥ `md`)**: persistent left drawer with brand "Home Menu", user
  role "Admin", and nav items: Dashboard (active), Cooking requests, Dishes,
  Inventory, Batches, Settings. Content area:
  - Row of five summary tiles: "Pending", "In progress", "Low stock",
    "Expired", "Ready portions".
  - Panel "Pending cooking requests" with a "View all ›" link and request rows,
    each with an inline primary "Approve" button:
    - "Tomato soup" — "Olena · 1 portion · Thu 10"
    - "Pancakes" — "Ihor · 3 portions · Fri 11"
  - Panel "⚠ Needs attention" (error.light tinted card, error.dark heading)
    listing exceptional items as label/value rows:
    - "Baked salmon batch" → "Expired"
    - "Mushrooms" → "120 g low"
- **Dark theme**: same layouts on the dark color scheme
  (`background.default`/`background.paper` from the dark palette,
  `cssVariables: true`, both schemes defined in `createTheme()`). No
  dashboard-specific dark mockup exists; apply the global scheme.
- **Primary action**: none (dashboard is navigational); quick actions and
  inline "Approve" are the actionable elements. No FAB.

## States

From data-states row "6 · Панель адміна · Admin dashboard":

- **Loading**: CatArt `sleep` + skeleton tiles. Caption: uk "Рахуємо порції…"
  (en "Counting portions…").
- **Empty** (nothing needs attention): CatArt `empty`. Title: uk "Усе спокійно"
  (en "All calm"). Body: uk "Немає запитів, прострочених партій чи дефіциту.
  Котик задоволений." (en "No requests, expired batches, or shortages. Kotyk
  is content."). No CTA shown in the mockup.
- **Error**: CatArt `confused`. Title: uk "Дані недоступні" (en "Data
  unavailable"). Body: uk "Не вдалося отримати зведення." (en "Couldn't fetch
  the summary."). Button: uk "Повторити" (en "Retry"), outlined primary.
- **Populated**: tiles labelled (uk) "Запити", "Готується", "Дефіцит",
  "Прострочено", "Порцій вільно" (en "Pending requests", "In progress",
  "Low-stock items", "Expired batch", "Portions ready to reserve").

## Components

- Summary tile: Paper, big count (`h3`-weight), caption label. Tint per
  semantics: pending → primary, in-progress → warning, low stock / expired →
  error, ready portions → success. Counts always show numbers ("0" is never
  hidden — global edge-case rule).
- Ready-portions banner: success.light background, success.dark text, CatArt.
- Quick-action row: outlined list item; count badge = Chip size small,
  primary.light background / primary.dark text.
- Needs-attention panel (desktop): error-tinted Paper; row per issue with
  error.dark value text.
- Bottom navigation (mobile) / persistent Drawer (desktop) — shared shell.

## Actions and dialogs

- "Review cooking requests" / "View all ›" → navigate to `/admin/orders`.
- "Restock ingredients" → navigate to `/admin/inventory`.
- Desktop inline "Approve" on a pending request row → same mutation as Approve
  on the Kanban (order `pending` → `approved`); no dialog in the mockup.
- Needs-attention rows: navigation targets not shown explicitly (expired batch
  → `/admin/batches`, low ingredient → `/admin/inventory` implied).
- No dialogs open from this screen itself.

## Validation

N/A — the screen has no forms.

## Accessibility

- Status/severity is conveyed by label text plus tint, not color alone
  (e.g. "⚠" glyph on the expired tile, "Expired" / "120 g low" text values).
- Touch targets: quick-action rows and tiles are full-width/≥44px rows.

## Resolved decisions

- **Mobile bottom-nav third tab**: the dedicated "Admin" ("Адмін") tab per
  the English mockups is canonical — NOT the "Більше" ("More") bottom sheet
  from the Dishes-management mockups. Amends the approved navigation-shell
  spec; a new linked spec will cover it.

## Open questions

- Desktop tile counts and whether "Ready portions" tile links anywhere are not
  specified.
- Whether tiles are tappable (navigate to the corresponding list) on mobile is
  not shown.
- Empty state shows no CTA; confirm none is desired.
- Exact `en` strings for the Ukrainian data-state copy are not in the mockup;
  the English equivalents above are proposed translations.
