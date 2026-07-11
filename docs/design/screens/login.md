# Login / onboarding

Route: `/login` · Audience: all

Transcribed from
`design/home-menu-kitchen-inventory-app/Home Menu.dc.html` (section "05
Screens · Member" → Login, and "05g Data states A" → "1 · Вхід · Login"),
which mocked an email/password form. This mockup was originally superseded
by a Google Sign-In implementation; per the `email-password-auth`
specification the owner reinstated the manually-provisioned email/password
model, so **this mockup is now the current, as-built screen**
(`src/features/auth/LoginPage.tsx`), not a historical reference. There is no
Google Sign-In, no self-service account creation, no in-app password reset,
and no email-verification flow — the client calls only
`signInWithEmailAndPassword`.

## Layout

- Mobile: full-screen page, no AppBar and no bottom navigation.
- Language switcher (`LanguageSwitcher`) in the top corner of the page.
- Centered column: CatArt `idle` hero mascot (~140px), logo mark (CatArt
  `logo`, `primary.main`) next to the app wordmark (`app.title`), then a
  tagline, then the email/password form.
- Desktop: no dedicated desktop mockup; same centered layout via theme
  tokens, dark theme via token remap only.
- Decorative gradient background with CatArt `paw` motifs, per the design
  mockup.
- Primary action: full-width contained «Sign in» / «Увійти» submit button.
- Below the form: a static, non-interactive "no access? contact the
  administrator" hint. It is plain text, not a mailto link or button — no
  admin email is hardcoded.

## Copy (as built — i18n keys)

| Element | Key | en | uk |
| --- | --- | --- | --- |
| Wordmark | `app.title` | "Home Menu" | «Хатнє меню» |
| Tagline | `auth.login.tagline` | "Your household's food inventory & menu" | «Домашній облік їжі та меню родини» |
| Email field label | `auth.login.emailLabel` | "Email" | «Електронна пошта» |
| Password field label | `auth.login.passwordLabel` | "Password" | «Пароль» |
| Show password toggle | `auth.login.showPassword` | "Show password" | «Показати пароль» |
| Hide password toggle | `auth.login.hidePassword` | "Hide password" | «Приховати пароль» |
| Submit button | `auth.login.submit` | "Sign in" | «Увійти» |
| No-access hint | `auth.login.noAccessHint` | "No access? Contact the administrator." | «Немає доступу? Зверніться до адміністратора.» |
| Invalid credentials error | `auth.login.errors.invalidCredentials` | generic wrong-credentials copy | generic wrong-credentials copy |
| Too-many-requests error | `auth.login.errors.tooManyRequests` | throttling copy | throttling copy |
| Network error | `auth.login.errors.network` | network-failure copy | network-failure copy |
| Generic error | `auth.login.errors.generic` | fallback failure copy | fallback failure copy |
| Not-activated title | `auth.notActivated.title` | "Profile not activated yet" | «Профіль ще не активовано» |
| Not-activated body | `auth.notActivated.body` | body naming the signed-in email (`{{email}}`) | body naming the signed-in email (`{{email}}`) |
| Not-activated contact block | `auth.notActivated.contactAdmin` | contact-administrator copy | contact-administrator copy |
| Sign out button | `auth.signOut` | "Sign out" | «Вийти» |

Exact `en`/`uk` wording for the error and not-activated keys is transcribed
from the design mockup in the translation resources
(`src/locales/{uk,en}/translation.json`); this table lists the keys and their
intent, not a verbatim copy dump.

## States

1. **default** — language switcher, CatArt `idle` hero, wordmark, tagline,
   empty email/password fields, password field with a show/hide toggle
   button, enabled «Sign in» button, static no-access hint.
2. **validating** — email and password are both required; email format is
   validated; the submit button is disabled while any field is invalid or a
   request is in flight.
3. **submitting** — the button shows a `CircularProgress` spinner with an
   `aria-label`; repeat submits are blocked while the request is in flight.
4. **error** — on sign-in failure, an inline error message is shown (mapped
   from the Firebase error code to one of the `auth.login.errors.*` keys);
   the button returns to enabled so the user can retry. Wrong password and
   unknown account share one generic message — the app never discloses
   whether an account exists.

No CatArt loading/empty/error trio variants on the login screen itself —
Firebase Auth state is resolved before this page settles into one of the
states above.

## Components

Top to bottom:

1. `LanguageSwitcher` (top corner).
2. CatArt `idle` hero mascot.
3. Logo mark (CatArt `logo`) + app wordmark (`app.title`).
4. Tagline (`auth.login.tagline`, `text.secondary`, centered).
5. Email `TextField` (`auth.login.emailLabel`, `type="email"`, appropriate
   autocomplete).
6. Password `TextField` (`auth.login.passwordLabel`) with a labeled show/hide
   `IconButton`.
7. Full-width contained «Sign in» button (`auth.login.submit`); shows a
   spinner while submitting.
8. Inline error text (one of `auth.login.errors.*`) shown only after a failed
   attempt.
9. Static no-access hint (`auth.login.noAccessHint`).

### Not-activated state (`RequireActiveProfile` → `NotActivatedState`)

A single unified screen, rendered after a successful sign-in whose account is
not yet activated — no `role` claim, an unknown `role`, or `isActive !== true`
(loading state renders `AuthLoadingState` instead; unauthenticated visitors
are redirected to `/login`). The session is **kept**; there is no automatic
sign-out. This replaces the previous two separate screens
(`NotAuthorizedState` for no-role and `AccessDeniedState` for inactive).

- CatArt `confused` hero.
- Headline: `auth.notActivated.title` — "Profile not activated yet" /
  «Профіль ще не активовано».
- Body naming the signed-in email: `auth.notActivated.body` (interpolates
  `{{email}}`).
- Static contact-administrator info block: `auth.notActivated.contactAdmin`.
- Outlined button `auth.signOut` — "Sign out" / «Вийти» — that calls
  `signOut()`.

### 403 / 404 pages

Two conventional, minimal error pages complement the login/not-activated
flow, registered at the top level of the router (outside the authenticated
app shell):

- **`/403` (forbidden)** — reached when an authenticated, active, non-admin
  visitor requests an admin-only route (`RequireAdmin`). Large "403" heading
  plus a single localized button that navigates to `/`, which resolves to the
  visitor's role-appropriate home via the root redirect (`admin` → `/admin`,
  `user` → `/menu`, unauthenticated → `/login`).
- **`/404` (catch-all, not found)** — reached for any unknown path. Same
  minimal layout with "404" and the same home button.

Both pages are intentionally minimal (numeric code + one navigation button);
no illustration or extended copy. A `usePermissions` hook centralizes the
role/activation checks that both `RequireActiveProfile` and `RequireAdmin`
use to decide between rendering content, the not-activated screen, and the
`/403` redirect.

## Actions and dialogs

- «Sign in» button → `signInWithEmailAndPassword(email, password)`. On
  success with an activated account, redirect to the role-appropriate home
  (menu for members, admin area for admins). On success with a
  not-yet-activated account, `RequireActiveProfile` renders the unified
  not-activated screen and keeps the session. On sign-in failure, show the
  mapped inline error and re-enable the form.
- Password show/hide `IconButton` toggles the password field's `type`
  between `password` and `text`; no dialog.
- No account-creation, password-reset, or Google sign-in affordance exists
  anywhere on this screen.

## Validation

- Email and password are both required.
- Email must match a plausible email format.
- The submit button is disabled while any field is invalid or a request is
  in flight; repeat submits are blocked.

## Accessibility

- Touch targets ≥ 44px.
- The password show/hide toggle is a labeled button
  (`auth.login.showPassword` / `auth.login.hidePassword`).
- The email field uses `type="email"` with appropriate autocomplete.
- The in-progress spinner carries an `aria-label` so it is announced to
  assistive tech.
- Error states pair color with text (inline error message), never color
  alone.
- The numeric code on the `/403` and `/404` pages has an accessible heading.

## Resolved decisions

- **Auth method: email/password only, manually provisioned** (reinstates the
  original mockup; supersedes the intermediate Google Sign-In
  implementation): per `docs/06-auth-and-security.md`, there is no Google
  Sign-In, no self-registration, no in-app password reset, and no
  email-verification gating. Access is granted only by the owner creating the
  Firebase Auth account and running `scripts/setUserRole.mjs` to set the
  `role` and `isActive` custom claims.
- **Language switcher on login**: present in the top corner, matching the
  design mockup (this differs from the superseded Google-only
  implementation, which had no switcher on this route).
- **Unified not-activated screen** (`RequireActiveProfile` /
  `NotActivatedState`): a single keep-session screen with headline, body
  naming the email, a contact-administrator block, and a "Sign out" button,
  replacing the previous two separate not-authorized/access-denied screens.
- **Conventional `/403` and `/404` pages**: minimal numeric-code pages with a
  single role-aware home button, replacing the previous inline
  access-denied panel for admin-route role mismatches.

## Historical note

The email/password form documented above was the original design mockup.
Between the initial build and this revision, the application briefly used
Google Sign-In instead (documented as "as-built" in an earlier version of
this file, and as the source model in
`docs/specifications/auth-custom-claims-migration/SPEC.md`, which remains the
immutable historical record for the claims/no-self-signup authorization
model). The `email-password-auth` specification reinstated the email/password
mockup as the permanent, current implementation — it is not a temporary or
superseded state.
