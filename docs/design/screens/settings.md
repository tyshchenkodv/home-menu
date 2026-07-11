# Settings

Route: `/settings` · Audience: all

Source: `design/home-menu-kitchen-inventory-app/Home Menu.dc.html` — mobile
mockup "Settings" (Administrator section, English copy), forms card
"Налаштування · час прийомів їжі" ("05f Forms & validation", never-saved
variant, Ukrainian copy), data-state row "11 · Налаштування · Settings".

## Layout

- **Mobile (< `md`)**: app bar title "Settings" (uk "Налаштування"). Scrollable
  body of grouped sections; sticky footer bar with a full-width contained
  primary button "Save changes" (uk "Зберегти"). On mobile, admins reach
  Settings via the dedicated "Admin" bottom tab (resolved decision — the
  "Більше" / More sheet variant is superseded; see `shared-patterns.md`).
- **Desktop (≥ `md`)**: persistent drawer with "Settings" ("Налаштування") as a
  nav item; no dedicated desktop mockup — apply the standard single-column
  content layout.
- **Dark theme**: no dedicated mockup; global dark scheme applies.
- **Primary action**: footer "Save changes" button (settings are saved
  explicitly, not per-field).

## Sections and components

### 1. Default meal times

Overline header: en "Default meal times" (uppercase, letter-spaced,
text.secondary). Card (Paper, radius 16) with one row per meal; each row:

- Meal Chip: en "Breakfast" / uk "Сніданок"; en "Lunch" / uk "Обід";
  en "Dinner" / uk "Вечеря". Chip tints: breakfast — orange-tinted
  (custom/warm accent), lunch — success.light bg / success.dark text,
  dinner — secondary.light bg / secondary.dark text.
- Time control: a **time-picker field** per row (native `type="time"` /
  MUI TimeField), e.g. "08:00" with a clock glyph; the focused field gets a
  primary border + primary.light focus ring. (Resolved decision: the
  forms-section time field is canonical; the stepper variant shown on the
  Administrator-section screen is superseded.)

**Never-saved defaults** (forms-section card):

- Info banner (info.light background, info.dark text): uk "Використовуються
  типові значення — збережіть, щоб зафіксувати свої." (en "Default values are
  in use — save to lock in your own.")
- Helper below the list: uk "Типові: 08:00 · 13:00 · 19:00 · застосовуються до
  нових запитів, наявні не змінюються." (en "Defaults: 08:00 · 13:00 · 19:00 ·
  they apply to new requests; existing ones are unchanged.")
- Buttons row: outlined neutral uk "Скинути до типових" (Reset to defaults) ·
  contained primary uk "Зберегти" (Save).

### 2. Language

Overline header: en "Language" (uk "Мова" implied, not shown). Card row:

- Label: en "App language" (uk "Мова застосунку" implied).
- Segmented toggle (pill): "UA" selected (contained primary segment) · "EN"
  (text segment). Note: the visible toggle label is "UA" although the language
  code in code must be `uk` (project rule — never `ua` as a code; "UA" here is
  display copy for the Ukrainian segment).

### 3. Footer

Full-width contained primary "Save changes" (uk "Зберегти") in a bordered
footer bar.

## States

From data-state row "11 · Налаштування · Settings" (four variants):

- **Loading**: skeletons; caption uk "Завантаження…" (en "Loading…").
- **Never saved** ("never saved · типові значення"): populated with default
  values plus the info banner uk "Використовуються типові значення" (see
  above) — this replaces a classic empty state.
- **Error — save failed** ("error · збереження не вдалося"): title uk "Не
  збереглося" (en "Didn't save"). Body: uk "Зміни не застосовано — спробуйте
  ще раз." (en "The changes were not applied — try again."). Button:
  uk "Повторити" (en "Retry"). (Save error, not load error.)
- **Populated — saved by user** ("populated · збережено користувачем"): rows
  Breakfast/Lunch/Dinner with the user's saved times and the uk "Зберегти"
  button; no banner.

## Actions and dialogs

- Change a meal time (time-picker field) → local form state; persisted
  only on Save.
- "Скинути до типових" (Reset to defaults) → sets 08:00 / 13:00 / 19:00 in the
  form; no confirmation dialog shown.
- "Save changes" / "Зберегти" → persists meal times (and language?) for the
  household; defaults apply to **new** cooking requests only, existing
  requests keep their times.
- Language toggle UA/EN → switches `i18next` locale (`uk` default, `en`
  fallback). Whether it applies immediately or on Save is not specified.
- No dialogs on this screen.

## Validation

- No field-level validation messages are mocked for settings. Time values come
  from constrained time-picker controls, so free-text errors do not apply.
- Global submit rules apply to Save: disabled while invalid/unchanged
  (uk helper "disabled — поки форма невалідна"), submitting state with spinner
  and uk "Збереження…", repeat clicks blocked.

## i18n

- All strings above require both `uk` and `en` resources; the mockup provides
  the English set on the Administrator screen and the Ukrainian set in the
  forms/data-states sections.
- Layout must tolerate the longer translation of each pair (global rule).

## Accessibility

- Time fields need ≥44px hit areas.
- Meal chips carry text labels; time values are text, not color-coded.

## Resolved decisions

- **Theme control**: the theme toggle (light/dark) lives ONLY in the
  AppHeader. Settings has NO theme row. This supersedes the currently
  implemented Settings theme row, which must be removed.
- **Time control**: default meal times use a time-picker field (native
  `type="time"` / MUI TimeField), not a stepper.

## Open questions

- Are default meal times per-household (admin-editable only) or per-user? The
  screen sits in the admin group, but the route/audience is "all".
- Does the language toggle apply instantly or only after "Save changes"?
- "Скинути до типових" appears only on the never-saved forms card — is it also
  present once settings have been saved?
- Footer label mismatch: "Save changes" (mobile screen) vs "Зберегти" (forms
  card) — same action assumed.
