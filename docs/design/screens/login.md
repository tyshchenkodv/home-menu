# Login / onboarding

Route: `/login` · Audience: all

Originally transcribed from
`design/home-menu-kitchen-inventory-app/Home Menu.dc.html` (section "05
Screens · Member" → Login, and "05g Data states A" → "1 · Вхід · Login"),
which mocked an email/password form. **Superseded**: per
`docs/06-auth-and-security.md`, authentication is Google Sign-In only — there
is no email/password form, no self-service password recovery, and no
account-creation flow. The section below documents the AS-BUILT screen
(`src/features/auth/LoginPage.tsx`); the original email/password mockup
transcription is kept in Resolved decisions for historical reference only.

## Layout

- Mobile: full-screen page, no AppBar and no bottom navigation.
- Centered column: CatArt `idle` hero mascot (~140px), logo mark (CatArt
  `logo`, `primary.main`) next to the app wordmark (`app.title`), then a
  tagline, then a "Sign in" title, then the Google Sign-In button.
- No language switcher on this screen (`LanguageSwitcher` is only used in
  `AppHeader`, which does not render on the unauthenticated login route).
- Desktop: no dedicated desktop mockup; same centered layout via theme
  tokens, dark theme via token remap only.
- Primary action: full-width contained button labeled «Sign in with
  Google» / «Увійти через Google».

## Copy (as built — i18n keys)

| Element | Key | en | uk |
| --- | --- | --- | --- |
| Wordmark | `app.title` | "Home Menu" | «Хатнє меню» |
| Tagline | `auth.login.tagline` | "Your household's food inventory & menu" | «Домашній облік їжі та меню родини» |
| Title | `auth.login.title` | "Sign in" | «Вхід до системи» |
| Google button | `auth.login.googleButton` | "Sign in with Google" | «Увійти через Google» |
| Signing-in label | `auth.login.signingIn` | "Signing in..." | «Виконується вхід...» |
| Sign-in error | `auth.login.error` | "Failed to sign in. Please try again." | «Не вдалося увійти. Спробуйте ще раз.» |

## States

1. **default** — CatArt `idle` hero, wordmark, tagline, title, enabled
   Google Sign-In button.
2. **submitting** — the button shows a `CircularProgress` spinner with
   `aria-label={t('auth.login.signingIn')}`; repeat clicks blocked while
   the popup/redirect is in flight.
3. **error** — on sign-in failure, an inline error message
   (`auth.login.error`) is shown; the button returns to enabled so the user
   can retry.
4. **access-denied** (post-authentication, not on this route but reached
   right after a successful Google sign-in for an inactive/unprovisioned
   profile): see `RequireActiveProfile` / `AccessDeniedState` below.

No CatArt loading/empty/error trio variants on the login screen itself —
Firebase Auth state is resolved before this page settles into one of the
states above.

## Components

Top to bottom:

1. CatArt `idle` hero mascot.
2. Logo mark (CatArt `logo`) + app wordmark (`app.title`).
3. Tagline (`auth.login.tagline`, `text.secondary`, centered).
4. Title (`auth.login.title`).
5. Full-width contained "Sign in with Google" button (`auth.login.googleButton`);
   shows a spinner while signing in.
6. Inline error text (`auth.login.error`) shown only after a failed attempt.

### Access-denied state (`RequireActiveProfile` → `AccessDeniedState`)

Rendered after a successful Google sign-in when the user's `users/{uid}`
profile is missing or `active == false` (loading state renders
`AuthLoadingState` instead; unauthenticated visitors are redirected to
`/login`):

- Headline: `auth.accessDenied.title` — "Access denied" / «Доступ
  заборонено».
- Body: `auth.accessDenied.description` — "Your account does not have
  active administrator access to this page." / «У вашого облікового запису
  немає активного доступу адміністратора до цієї сторінки.».
- Outlined button `auth.signOut` — "Sign out" / «Вийти» — that calls
  `signOut()`.

## Actions and dialogs

- Google Sign-In button → Firebase Auth Google sign-in popup/redirect. On
  success with an active profile, redirect to the role-appropriate home
  (menu for members, admin area for admins). On success with an
  inactive/missing profile, `RequireActiveProfile` renders the
  access-denied state. On sign-in failure, show the inline error and
  re-enable the button.
- No language toggle and no dialogs on this screen.

## Validation

Not applicable — there is no form to validate; the only interactive control
is the Google Sign-In button.

## Accessibility

- Touch targets ≥ 44px.
- The in-progress spinner carries an `aria-label` (`auth.login.signingIn`)
  so it is announced to assistive tech.
- Error states pair color with text (inline error message), never color
  alone.

## Resolved decisions

- **Auth method: Google Sign-In only** (supersedes the original
  email/password mockup transcription): per
  `docs/06-auth-and-security.md`, there is no email/password form, no
  password field, no "forgot password" affordance, and no self-registration.
  Access is granted by an administrator manually creating `users/{uid}`
  after the person's first Google sign-in.
- **No language switcher on login**: the switcher lives in `AppHeader`,
  which is not shown on the unauthenticated login route.
- **Access-denied / "no active profile" screen** (`RequireActiveProfile` /
  `AccessDeniedState`): headline + body copy + a "Sign out" button, as
  documented above (accepted default).

## Historical mockup reference (superseded)

The original design mockup
(`design/home-menu-kitchen-inventory-app/Home Menu.dc.html`, "05 Screens ·
Member" → Login) showed an email/password form: email + password
`TextField`s (with a show/hide toggle on the password field), a «Увійти» /
"Sign in" submit button, inline email-format and required-field validation,
and a server-error banner for wrong credentials, plus a `UA | EN` language
switcher pill and decorative CatArt `paw` motifs on a gradient background.
None of this was built; Google Sign-In replaced it entirely per the
architecture decision in `docs/06-auth-and-security.md`. This paragraph
replaces the previous verbatim mockup transcription in this file.
