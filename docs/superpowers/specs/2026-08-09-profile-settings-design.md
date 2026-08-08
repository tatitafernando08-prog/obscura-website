# Profile/Settings Page — Design

Date: 2026-08-09
Status: Approved

## Problem

There is no Profile/Settings page in the React app. The only related UI is a disabled
"Profile" sidebar item with a "Soon" badge (`src/components/app-shell/Sidebar.tsx`).

Two account-related gaps this feature closes:

1. `student_profiles` has no `name` field, so the app never captures the student's name.
2. The theme picker (Purple/Pink/Owl/Green) only exists inside the legacy Focus Room
   page (`public/legacy/focus-room.html`), stored under the `obscura_focus_theme`
   localStorage key. It is per-browser, not per-account — switching devices or clearing
   storage loses the preference, and the setting lives nowhere a signed-in user can
   manage it directly.

This is greenfield work; there is no prior spec covering it (the existing
`2026-07-21-react-vite-conversion-design.md` explicitly scoped Focus Room theming out
of Phase 1).

## Scope

**In scope:**
- Add `name` and `theme` columns to `student_profiles`.
- New `/app/settings` page in the React app: edit name, pick a theme, save.
- Wire the sidebar's "Profile" stub to the new route.
- Keep the legacy Focus Room page working unmodified by dual-writing the chosen theme
  to its existing localStorage key.

**Out of scope (explicitly):**
- Editing `exam_type`, `syllabus`, `stream`, or `medium` from Settings — those stay
  fixed after onboarding.
- Applying theme colors to the React app shell (dashboard, sidebar, etc.). Today only
  the legacy Focus Room page is visually themed; that stays true after this change.
  App-shell theming is deferred until Focus Room itself is migrated to React.
- Any change to the legacy `focus-room.html` script beyond it continuing to read the
  same localStorage key it already reads.
- Avatar/photo upload, email/password change, account deletion — not requested.

## Data model

```sql
ALTER TABLE student_profiles
  ADD COLUMN name text,
  ADD COLUMN theme text NOT NULL DEFAULT 'purple'
    CHECK (theme IN ('purple', 'pink', 'owl', 'green'));
```

- `name` is nullable. No existing row has one, and nothing else in the app requires it
  to be set, so there is no backfill and no forced "set your name" gate.
- `theme` is `NOT NULL DEFAULT 'purple'`, matching Focus Room's existing default, so
  every existing row gets a valid value automatically — no backfill needed.
- To apply: paste the SQL above into the Supabase SQL editor (no migrations folder or
  CLI exists in this repo — decided during brainstorming to keep using the manual
  dashboard process already in use for this table).

`src/types/profile.ts`:

```ts
export interface StudentProfile {
  id: string;
  exam_type: 'OL' | 'AL';
  syllabus: 'local' | 'edexcel' | 'cambridge';
  stream: 'science' | 'commerce' | 'arts' | 'technology' | null;
  medium: 'english' | 'sinhala' | 'tamil';
  name: string | null;
  theme: 'purple' | 'pink' | 'owl' | 'green';
}
```

## Components

### `src/pages/app/SettingsPage.tsx` (new)

Replaces the placeholder pattern used by other `/app/*` pages (e.g.
`FocusRoomPage.tsx`) with a real form, styled after `OnboardingPage.tsx`'s
existing form conventions (`option-grid`/`option-card`-style selection, `btn-primary`,
inline error banner, `saving` disabled state) rather than inventing new patterns.

State and behavior:
- Pre-filled from `useAuth().profile` (`name`, `theme`) on mount.
- Name: a plain text input, optional (empty string allowed), trimmed before save.
- Theme: four swatches (Purple/Pink/Owl/Green), rendered as clickable color circles —
  a React port of the legacy `.theme-dot` markup/colors from `focus-room.html`, using
  the same gradient values so the swatch preview matches what Focus Room will actually
  look like.
- Save button calls:
  ```ts
  const { error } = await supabase
    .from('student_profiles')
    .update({ name: name.trim() || null, theme })
    .eq('id', session.user.id);
  ```
  On success: `localStorage.setItem('obscura_focus_theme', theme)`, then
  `await refreshProfile()`, then show a brief "Saved" confirmation (no navigation away
  — this is a settings page, not a wizard step).
  On failure: inline error message (same visual pattern as `onboarding-error`), form
  stays editable, nothing is written to localStorage.

### `src/context/AuthContext.tsx` (modified)

`loadProfile` already runs on every session load and auth-state change and already
syncs a legacy artifact (`syncLegacySession`, the `obscura_session` key) for the sake
of the still-live legacy pages. Add the same treatment for theme: whenever a profile
loads successfully, also write its `theme` to `localStorage['obscura_focus_theme']`.

This means the DB is the actual source of truth and the sync isn't limited to the
moment a user hits Save on `/app/settings` — logging in on a different browser/device
also propagates the stored theme to Focus Room immediately, without requiring a visit
to Settings first.

No new methods are added to the `AuthContextValue` interface — `SettingsPage` calls
`supabase` directly (consistent with how `OnboardingPage` writes the profile today)
and reuses the existing `refreshProfile()`.

### `src/router.tsx` (modified)

Add one entry next to the other `/app/*` children, following the exact existing
`lazy` pattern:

```ts
{ path: 'settings', lazy: () => import('./pages/app/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
```

### `src/components/app-shell/Sidebar.tsx` (modified)

Replace the disabled `<span className="app-nav-item">...Profile<span className="app-nav-soon">Soon</span></span>` stub with a real `NavLink` to `/app/settings`, using the
same markup shape as the other `NAV_ITEMS` entries (icon + label, `active` class via
`isActive`). Label reads "Settings" (matches the route and the page's actual contents,
which are settings, not a profile display).

### Styles

New rules added to `src/styles/app-shell.css` (or a small new `src/styles/settings.css`
imported from the page, consistent with how `onboarding.css` is a separate file) for
the theme swatch row. Swatch colors are lifted directly from
`public/legacy/focus-room.html`'s theme gradients so the picker preview is accurate:

```css
.theme-swatch.purple { background: linear-gradient(160deg, #2D1F4E 0%, #4A3470 45%, #7C5CBF 100%); }
.theme-swatch.pink   { background: linear-gradient(160deg, #4E1F3A 0%, #8A3D63 45%, #D96BA0 100%); }
.theme-swatch.owl    { background: linear-gradient(160deg, #0B0F2E 0%, #171B3D 45%, #2E3364 100%); }
.theme-swatch.green  { background: linear-gradient(160deg, #123024 0%, #1F5240 45%, #3F9C77 100%); }
```

(Purple is Focus Room's no-class default, taken from the base `.focus-room` rule in
`public/legacy/focus-room.html`; the other three are its explicit `.theme-*` rules.)

## Data flow

```
Settings page mount
  → useAuth().profile (already loaded by AuthContext on session load)
  → form pre-filled with profile.name, profile.theme

Save
  → supabase.update({ name, theme }) on student_profiles
  → on success: localStorage['obscura_focus_theme'] = theme
  → refreshProfile() → AuthContext.loadProfile() re-fetches
  → (loadProfile's own theme→localStorage sync fires too, redundantly but harmlessly)

Any later login / session refresh (any device)
  → AuthContext.loadProfile() fetches profile
  → localStorage['obscura_focus_theme'] = profile.theme
  → legacy focus-room.html reads that key on its own load, unaffected otherwise
```

## Error handling

- Update fails (network/RLS/etc.): inline error banner in the form, save button
  re-enabled, no localStorage write, no `refreshProfile()` call — form keeps the
  user's unsaved input.
- `profile` is `null` when `SettingsPage` mounts: shouldn't happen under normal
  navigation, since `/app/*` is already gated by `ProtectedRoute require="profile"`,
  which redirects to `/onboarding` if no profile row exists. No extra guard needed
  beyond what the route already provides.
- Name field has no format validation — any string (including empty, which is stored
  as `null`) is accepted.

## Testing

No test framework exists in this repo (`package.json` has no `test` script, no
Jest/Vitest). Verification is:
- `npm run build` (runs `tsc -b` — catches type errors from the `StudentProfile`
  shape change across `AuthContext`, `OnboardingPage`, and the new `SettingsPage`).
- `npm run lint` (oxlint).
- Manual browser check: set a name and each of the 4 themes, reload, confirm they
  persist; confirm `/legacy/focus-room.html` picks up the saved theme without visiting
  it first; confirm save failure (e.g. temporarily wrong table name) shows the error
  state without losing form input.
