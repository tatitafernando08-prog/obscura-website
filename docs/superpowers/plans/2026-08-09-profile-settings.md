# Profile/Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give signed-in students a `/app/settings` page where they can set their name and pick an account-level theme (Purple/Pink/Owl/Green), replacing the theme picker's current browser-only localStorage existence inside the legacy Focus Room page.

**Architecture:** Add `name`/`theme` columns to `student_profiles` (applied manually via the Supabase SQL editor — no migrations tooling exists in this repo). Extend the `StudentProfile` TypeScript type and `AuthContext` to treat the DB as the source of truth, syncing `theme` into the same `obscura_focus_theme` localStorage key the legacy Focus Room page already reads, so that page keeps working unmodified. Add one new React page (`SettingsPage`) using a plain `supabase.update()` call, following the same direct-Supabase-call pattern `OnboardingPage` already uses for `insert()`. Wire it into the router and sidebar nav.

**Tech Stack:** React 19, React Router v7 (data router, lazy-loaded routes), TypeScript (strict), `@supabase/supabase-js`, plain CSS (no CSS-in-JS, no Tailwind).

## Global Constraints

- No automated test framework exists in this repo — verify every task with `npm run build` (must exit 0) and `npm run lint` (oxlint, must exit 0), plus a manual `npm run dev` browser check where noted. Do not introduce a test framework as part of this work.
- Follow existing code conventions exactly: direct `supabase.from(...)` calls in page components (no new API/service layer), CSS classes in the existing plain-CSS files (no CSS modules, no styled-components), lazy-loaded routes via `lazy: () => import(...)`.
- No app-shell (dashboard/sidebar/etc.) visual theming — theme selection stays a stored preference only, consumed today solely by the legacy Focus Room page. This is explicitly out of scope per the approved design spec.
- No editing of `exam_type`/`syllabus`/`stream`/`medium` from this page — those stay onboarding-only, out of scope per the approved design spec.
- Do not modify `public/legacy/focus-room.html`'s script — it must keep working unmodified by reading the same `obscura_focus_theme` localStorage key it already reads.
- Spec reference: `docs/superpowers/specs/2026-08-09-profile-settings-design.md`.

---

### Task 1: Schema migration and `StudentProfile` type update

**Files:**
- External: `student_profiles` table in Supabase (schema change — no file in this repo represents it, per the approved design's decision to keep using the manual SQL-editor process already in use for this table)
- Modify: `src/types/profile.ts`
- Modify: `src/pages/OnboardingPage.tsx:55-61` (payload type annotation)

**Interfaces:**
- Produces: `StudentProfile` interface with two new fields — `name: string | null` and `theme: ThemeName` — and a new exported `ThemeName = 'purple' | 'pink' | 'owl' | 'green'` type, plus a new `NewStudentProfile` type (all `StudentProfile` fields except `name`/`theme`, since those aren't collected at onboarding time and rely on the DB's default/null). Every later task imports `ThemeName` from `../../types/profile` (pages under `src/pages/app/`) or `../types/profile` (`src/context/AuthContext.tsx`).

This task requires one manual action from you (the user) partway through — I cannot run SQL against your Supabase project myself.

- [ ] **Step 1: Run the schema migration in the Supabase SQL editor**

Open your Supabase project's SQL editor and run:

```sql
ALTER TABLE student_profiles
  ADD COLUMN name text,
  ADD COLUMN theme text NOT NULL DEFAULT 'purple'
    CHECK (theme IN ('purple', 'pink', 'owl', 'green'));
```

Confirm it succeeds (0 rows affected is expected — this only changes the schema) and that `student_profiles` now shows `name` and `theme` columns in the table editor, with every existing row's `theme` already backfilled to `'purple'` by the `DEFAULT`.

- [ ] **Step 2: Update the `StudentProfile` type**

Replace the full contents of `src/types/profile.ts`:

```ts
export type ThemeName = 'purple' | 'pink' | 'owl' | 'green';

export interface StudentProfile {
  id: string;
  exam_type: 'OL' | 'AL';
  syllabus: 'local' | 'edexcel' | 'cambridge';
  stream: 'science' | 'commerce' | 'arts' | 'technology' | null;
  medium: 'english' | 'sinhala' | 'tamil';
  name: string | null;
  theme: ThemeName;
}

export type NewStudentProfile = Omit<StudentProfile, 'name' | 'theme'>;
```

- [ ] **Step 3: Fix the now-broken `OnboardingPage` insert type**

`OnboardingPage.tsx` builds a payload typed as the full `StudentProfile` for its `insert()` call, but it never collects `name`/`theme` (the DB fills `theme`'s default and leaves `name` null) — so once `StudentProfile` requires those fields, this object literal no longer satisfies the type. In `src/pages/OnboardingPage.tsx`, change the import and the payload's type annotation:

```ts
// before
import type { StudentProfile } from '../types/profile';
// ...
const payload: StudentProfile = {
  id: session.user.id,
  exam_type: answers.exam_type as ExamType,
  syllabus: answers.syllabus as Syllabus,
  stream: answers.exam_type === 'OL' ? null : (answers.stream as Stream),
  medium: answers.medium as Medium,
};
```

```ts
// after
import type { NewStudentProfile } from '../types/profile';
// ...
const payload: NewStudentProfile = {
  id: session.user.id,
  exam_type: answers.exam_type as ExamType,
  syllabus: answers.syllabus as Syllabus,
  stream: answers.exam_type === 'OL' ? null : (answers.stream as Stream),
  medium: answers.medium as Medium,
};
```

- [ ] **Step 4: Build to confirm the type change compiles cleanly**

Run: `npm run build`
Expected: exits 0, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/profile.ts src/pages/OnboardingPage.tsx
git commit -m "Add name and theme fields to StudentProfile type"
```

---

### Task 2: Sync `theme` from the DB into the legacy localStorage key

**Files:**
- Modify: `src/context/AuthContext.tsx:42-61` (`loadProfile`)

**Interfaces:**
- Consumes: `StudentProfile.theme: ThemeName` (Task 1).
- Produces: no new exports — this is a side effect added inside the existing `loadProfile` callback. Later tasks rely on the *behavior* (localStorage's `obscura_focus_theme` key always reflecting the current profile's theme after any session load or profile refresh), not a new function signature.

- [ ] **Step 1: Add the sync inside `loadProfile`**

In `src/context/AuthContext.tsx`, add a small helper near the existing `syncLegacySession` function, and call it from `loadProfile` right where the profile is set:

```ts
// add near syncLegacySession, above AuthProvider
const THEME_STORAGE_KEY = 'obscura_focus_theme';

function syncThemeToLegacyStorage(profile: StudentProfile | null) {
  if (profile) {
    localStorage.setItem(THEME_STORAGE_KEY, profile.theme);
  }
}
```

Then update `loadProfile`'s success branch:

```ts
// before
    if (error) {
      console.error('Could not load profile', error);
      setProfile(null);
    } else {
      setProfile(data as StudentProfile | null);
    }
    setProfileLoading(false);
```

```ts
// after
    if (error) {
      console.error('Could not load profile', error);
      setProfile(null);
    } else {
      const loaded = data as StudentProfile | null;
      setProfile(loaded);
      syncThemeToLegacyStorage(loaded);
    }
    setProfileLoading(false);
```

- [ ] **Step 2: Build to confirm no type errors**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Manual check**

Run `npm run dev`, log in with an existing test account (one that already completed onboarding, so it has a `student_profiles` row with `theme = 'purple'` from Task 1's default), open devtools → Application → Local Storage, and confirm `obscura_focus_theme` is set to `purple` immediately after login — before visiting Focus Room or any settings page.

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "Sync profile theme into legacy Focus Room localStorage key on load"
```

---

### Task 3: `SettingsPage` — name field, theme picker, save

**Files:**
- Create: `src/pages/app/SettingsPage.tsx`
- Modify: `src/styles/app-shell.css` (append settings-specific rules)

**Interfaces:**
- Consumes: `useAuth()` → `{ session, profile, refreshProfile }` from `src/context/AuthContext.tsx` (existing, unchanged shape apart from `profile.name`/`profile.theme` per Task 1); `supabase` from `src/lib/supabaseClient.ts` (existing); `ThemeName` from `src/types/profile.ts` (Task 1).
- Produces: `export function SettingsPage()` — a default-export-free named export, matching every other page in `src/pages/app/` (e.g. `export function FocusRoomPage()`), consumed by Task 4's router entry as `m.SettingsPage`.

- [ ] **Step 1: Append theme-swatch and form styles to `app-shell.css`**

Add to the end of `src/styles/app-shell.css` (colors match the legacy Focus Room gradients exactly — see `public/legacy/focus-room.html`'s `.focus-room` base rule for purple and its `.theme-pink`/`.theme-owl`/`.theme-green` rules for the rest):

```css
.settings-field { margin-bottom: 24px; }
.settings-field label { display: block; font-size: 13px; font-weight: 600; color: #2D1F4E; margin-bottom: 8px; }
.settings-field input[type="text"] {
  width: 100%; max-width: 360px; padding: 12px 14px; border: 2px solid rgba(124,92,191,0.15);
  border-radius: 12px; font-size: 14px; font-family: inherit; color: #2D1F4E;
}
.settings-field input[type="text"]:focus { outline: none; border-color: #7C5CBF; }
.theme-swatch-row { display: flex; gap: 14px; }
.theme-swatch {
  width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
  border: 3px solid transparent; padding: 0;
}
.theme-swatch.selected { border-color: #2D1F4E; }
.theme-swatch.purple { background: linear-gradient(160deg, #2D1F4E 0%, #4A3470 45%, #7C5CBF 100%); }
.theme-swatch.pink   { background: linear-gradient(160deg, #4E1F3A 0%, #8A3D63 45%, #D96BA0 100%); }
.theme-swatch.owl    { background: linear-gradient(160deg, #0B0F2E 0%, #171B3D 45%, #2E3364 100%); }
.theme-swatch.green  { background: linear-gradient(160deg, #123024 0%, #1F5240 45%, #3F9C77 100%); }
.settings-saved { font-size: 13px; color: #3F9C77; margin-top: 12px; }
```

- [ ] **Step 2: Create `SettingsPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { ThemeName } from '../../types/profile';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'owl', label: 'Owl' },
  { value: 'green', label: 'Green' },
];

export function SettingsPage() {
  const { session, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [theme, setTheme] = useState<ThemeName>(profile?.theme ?? 'purple');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError('');
    setSaved(false);

    const { error: updateError } = await supabase
      .from('student_profiles')
      .update({ name: name.trim() || null, theme })
      .eq('id', session.user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    localStorage.setItem('obscura_focus_theme', theme);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="app-placeholder-card">
      <h2>Settings</h2>
      <form onSubmit={handleSave}>
        {error && <div className="onboarding-error visible">{error}</div>}

        <div className="settings-field">
          <label htmlFor="settings-name">Name</label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Your name"
          />
        </div>

        <div className="settings-field">
          <label>Theme</label>
          <div className="theme-swatch-row">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-label={t.label}
                className={`theme-swatch ${t.value}${theme === t.value ? ' selected' : ''}`}
                onClick={() => {
                  setTheme(t.value);
                  setSaved(false);
                }}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {saved && <p className="settings-saved">Saved.</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0. (Not reachable in the browser yet — no route points to it until Task 4 — but it must compile standalone.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/SettingsPage.tsx src/styles/app-shell.css
git commit -m "Add SettingsPage with name field and theme picker"
```

---

### Task 4: Wire the route and sidebar nav link

**Files:**
- Modify: `src/router.tsx:24-40` (add `settings` child route)
- Modify: `src/components/app-shell/Sidebar.tsx` (replace the disabled "Profile / Soon" stub with a real nav link)

**Interfaces:**
- Consumes: `SettingsPage` export from `src/pages/app/SettingsPage.tsx` (Task 3).
- Produces: the route `/app/settings`, reachable both by direct URL and via the sidebar — the last piece needed for the feature to be end-to-end usable.

- [ ] **Step 1: Add the route**

In `src/router.tsx`, add a new child route inside the `/app` route's children array (alongside `dashboard`/`chat`/`planner`/`focus-room`/`progress`):

```ts
// before
          { path: 'focus-room', lazy: () => import('./pages/app/FocusRoomPage').then((m) => ({ Component: m.FocusRoomPage })) },
          { path: 'progress', lazy: () => import('./pages/app/ProgressPage').then((m) => ({ Component: m.ProgressPage })) },
```

```ts
// after
          { path: 'focus-room', lazy: () => import('./pages/app/FocusRoomPage').then((m) => ({ Component: m.FocusRoomPage })) },
          { path: 'progress', lazy: () => import('./pages/app/ProgressPage').then((m) => ({ Component: m.ProgressPage })) },
          { path: 'settings', lazy: () => import('./pages/app/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
```

- [ ] **Step 2: Replace the sidebar's "Profile / Soon" stub with a real link**

In `src/components/app-shell/Sidebar.tsx`, add an entry to `NAV_ITEMS` (so it renders through the same `NavLink` mapping — active-state styling included — instead of the separate static `<span>`):

```ts
// before (end of NAV_ITEMS array)
  {
    to: '/app/progress',
    label: 'Progress',
    path: 'M5 19V10M12 19V5M19 19v-7',
  },
];
```

```ts
// after
  {
    to: '/app/progress',
    label: 'Progress',
    path: 'M5 19V10M12 19V5M19 19v-7',
  },
  {
    to: '/app/settings',
    label: 'Settings',
    path: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.1-1.2L14.4 3h-4.8l-.4 2.6a7.6 7.6 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2.1 1.2l.4 2.6h4.8l.4-2.6c.8-.3 1.5-.7 2.1-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  },
];
```

Then delete the now-redundant standalone stub (it renders after the `NAV_ITEMS.map(...)` block, before `app-sidebar-footer`):

```tsx
// delete this block entirely
      <span className="app-nav-item">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth={1.8} /><path d="M5 20c1.5-4 5-5.5 7-5.5S17.5 16 19 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" /></svg>
        Profile
        <span className="app-nav-soon">Soon</span>
      </span>
```

- [ ] **Step 3: Build and lint**

Run: `npm run build`
Expected: exits 0, no TypeScript errors, no unused-import warnings (the `app-nav-soon` CSS class becomes unused in JS but stays defined in `app-shell.css` — that's fine, it's a leftover style rule, not a lint target).

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Full manual walkthrough**

Run `npm run dev`, log in with a test account that has completed onboarding, then:

1. Click "Settings" in the sidebar — confirm it navigates to `/app/settings`, shows as the active nav item, and the form is pre-filled with the current name (empty on a fresh account) and the `purple` swatch selected (or whatever `theme` currently is).
2. Type a name, click a different theme swatch (confirm the clicked swatch gets the selected outline), click "Save changes" — confirm the button shows "Saving..." then a "Saved." message appears.
3. Reload the page — confirm the name and theme selection persist (i.e., they were actually written to `student_profiles`, not just local state).
4. Open devtools → Application → Local Storage, confirm `obscura_focus_theme` now matches the newly selected theme.
5. Navigate to `/legacy/focus-room.html` directly — confirm its background gradient matches the theme you just picked in Settings, without ever having opened Focus Room's own theme dots.
6. Back in Settings, temporarily break the update to confirm error handling: in devtools, go offline (Network tab → "Offline"), click "Save changes" again, confirm an inline error message appears and the form's entered values are not lost. Go back online afterward.

- [ ] **Step 5: Commit**

```bash
git add src/router.tsx src/components/app-shell/Sidebar.tsx
git commit -m "Wire /app/settings route and sidebar nav link"
```
