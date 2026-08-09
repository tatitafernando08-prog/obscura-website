# Focus Room Page — Design

Date: 2026-08-09
Status: Approved

## Problem

`/app/focus-room` is currently a placeholder (`src/pages/app/FocusRoomPage.tsx`) that
just links out to the still-live `public/legacy/focus-room.html`. That legacy page is
a fully working, self-contained study-session view: live clock + greeting, a Pomodoro
timer with focus/short-break/long-break cycling, rotating motivational quotes, a
swappable Spotify embed, and a "Today's Tasks" checklist backed by the `study_tasks`
table. It also owns the theme picker that the Profile/Settings feature (see
`docs/superpowers/specs/2026-08-09-profile-settings-design.md`) just moved to being
account-level (`student_profiles.theme`), with the legacy page kept working via a
`obscura_focus_theme` localStorage bridge written by `AuthContext`.

This is the second real feature built past the Phase 1 React/Vite conversion (see
`docs/superpowers/specs/2026-07-21-react-vite-conversion-design.md`, which explicitly
left Focus Room's timer/theme/quotes/Spotify logic out of scope), picked because —
like Settings — it's pure Supabase + client-side logic with no dependency on the new
backend still being built separately.

## Scope

**In scope:** full feature parity with the legacy page — clock/greeting, Pomodoro
timer, quotes, Spotify embed swap, Today's Tasks checklist (read + toggle
`completed` only, against the existing `study_tasks` table — no new tables, no new
columns) — reimplemented as a full-screen React page with no sidebar, matching the
legacy page's immersive layout exactly.

**Out of scope (explicitly):**
- Any change to `public/legacy/focus-room.html` itself, or to the other still-legacy
  pages (`dashboard.html`, `planner.html`, `progress.html`) that also read
  `study_tasks`.
- Persisting Pomodoro session history (e.g. a `focus_sessions` log for a future
  Progress page). The legacy page doesn't do this either — `sessionCount` is
  in-memory only, reset on reload. Not requested; not added.
- Creating/editing/deleting tasks from this page. Today's Tasks only reads today's
  rows and toggles `completed`, same as legacy.
- Applying `theme` colors to the rest of the React app shell (dashboard, sidebar).
  Still out of scope per the Profile/Settings design — Focus Room is the *first*
  page whose own visuals are theme-driven, but that doesn't extend to the sidebar
  shell around other pages.

## Architecture

**Layout** — today, `/app/focus-room` is nested inside the `/app` → `AppLayout`
branch in `src/router.tsx`, which always renders the sidebar. The legacy page has no
sidebar at all — it's a full-viewport immersive view with its own "Exit Focus Room"
link. To match that, `focus-room` moves to be a **sibling** of the `AppLayout` branch,
still under the same `ProtectedRoute require="profile"` parent (so auth/onboarding
gating is unchanged) but rendered standalone:

```tsx
{
  path: '/app',
  element: <ProtectedRoute require="profile" />,
  children: [
    { path: 'focus-room', lazy: () => import('./pages/app/FocusRoomPage').then((m) => ({ Component: m.FocusRoomPage })) },
    {
      lazy: () => import('./layouts/AppLayout').then((m) => ({ Component: m.AppLayout })),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard', lazy: ... },
        { path: 'chat', lazy: ... },
        { path: 'planner', lazy: ... },
        { path: 'progress', lazy: ... },
        { path: 'settings', lazy: ... },
      ],
    },
  ],
},
```

(`focus-room` is removed from the `AppLayout` children array and added as the new
first child of `/app`.) `Sidebar.tsx`'s existing "Focus Room" `NavLink` needs no
change — it already points at `/app/focus-room`, which still resolves correctly
under the new nesting.

**Component split** — the legacy page mixes five independent concerns in one
`<script>` block. Splitting them into focused files (new `src/components/focus-room/`
directory) rather than one large page file, matching this repo's existing pattern of
small single-purpose components:

- `src/pages/app/FocusRoomPage.tsx` — page shell: background/blobs, clock+greeting,
  exit link, theme dots, composes the four panels below. Owns theme state (reads
  `profile.theme`, writes changes straight to `student_profiles`).
- `src/components/focus-room/PomodoroTimer.tsx` — timer card: focus/short-break/
  long-break state machine, start/pause/skip controls. Self-contained; no props
  beyond nothing (no external state needed).
- `src/components/focus-room/QuoteRotator.tsx` — the 8 quotes, rotates every 20s.
  Self-contained.
- `src/components/focus-room/SpotifyPanel.tsx` — embed iframe + swap input. Self-
  contained (embed URL is local state).
- `src/components/focus-room/TasksPanel.tsx` — fetches/toggles today's `study_tasks`
  rows. Needs `session.user.id` — reads it itself via `useAuth()`, same pattern as
  `SettingsPage`.
- `src/styles/focus-room.css` — new stylesheet (added to the `import` list in
  `main.tsx` alongside `onboarding.css`/`app-shell.css`), ported from the legacy
  page's `<style>` block: `.focus-room`, `.focus-blob`, `.focus-timer-card`,
  `.glass-panel`, etc. Colors/gradients copied verbatim from
  `public/legacy/focus-room.html`.
- `src/types/task.ts` — new `StudyTask` type for the fields this page actually reads:
  `{ id: string; title: string; completed: boolean; task_date: string;
  scheduled_time: string | null }`.

## Data flow

**Theme** — `FocusRoomPage` reads `profile?.theme ?? 'purple'` from `useAuth()` for
the initial gradient/dot state (no more localStorage read on this page — that bridge
existed only for the *legacy* HTML page, which this doesn't touch). Clicking a theme
dot:
```
supabase.from('student_profiles').update({ theme }).eq('id', session.user.id)
  → on success: refreshProfile()
```
Same table and same call shape as `SettingsPage`, so a change made from either place
is immediately visible in the other next time they're loaded. This relies on the
`ProtectedRoute` fix already shipped in the Profile/Settings work (gating the
full-page loading state on "no profile yet" rather than "any profile
refresh") — without it, clicking a theme dot here would flash the whole page to a
blank "Loading..." screen. No local optimistic-then-revert handling is needed
beyond what `SettingsPage` already established: update local `theme` state
immediately on click (so the dot/background respond without waiting on the network),
same as the legacy page's instant `applyTheme()` call before its `localStorage`
write.

**Tasks** — `TasksPanel` on mount:
```
supabase.from('study_tasks').select('id,title,completed,task_date,scheduled_time')
  .eq('user_id', session.user.id).eq('task_date', todayISODate)
  .order('scheduled_time', { ascending: true })
```
Toggling a task's checkbox calls `supabase.from('study_tasks').update({ completed:
!completed }).eq('id', id)`, then refetches the day's list (mirrors legacy's
`loadTasks()`-after-every-toggle approach — no optimistic UI, kept simple/consistent
with what's there today rather than introducing new UX not asked for).

**Pomodoro timer** — same three durations as legacy (25/5/15 min), same
"every 4th break is long" rule. Implemented with a `useEffect` that starts/stops a
`setInterval` based on an `isRunning` boolean, with cleanup on unmount/pause instead
of legacy's manually-tracked `intervalId` — this is a mechanical translation, not a
behavior change.

**Quotes** — same 8 hardcoded quotes, same 20s rotation, same fade transition (CSS
`opacity` transition swapped for a `key`-based re-render or a class toggle timed to
match the legacy 400ms fade-out-then-swap).

**Spotify** — same regex (`open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)`)
matched against the pasted input to rewrite the iframe `src`; invalid input shows an
inline message instead of legacy's `alert()` (blocking browser alerts are worth
dropping in a React rewrite — same information, no modal-dialog UX regression).

**Greeting** — `` `Good ${timeOfDay}, ${displayName}.` `` where `displayName` is
`profile?.name?.trim() || session.user.email.split('@')[0]` — this is the one
behavior change from legacy (which only ever used the email prefix, since `name`
didn't exist yet). Falls back exactly like legacy when no name is set.

## Error handling

- Task fetch fails: panel shows "Couldn't load tasks right now." (verbatim from
  legacy), no retry button (matches legacy — reload the page to retry).
- Task toggle fails: logged to console, list left as-is (matches legacy's
  `catch (err) { console.error(...) }` with no user-facing error — this is a
  low-stakes convenience toggle, not a form submission).
- Theme update fails: no inline error UI on this page (unlike Settings) — clicking a
  theme dot is a quick-access convenience; if the write fails, the local dot state
  simply doesn't match `profile.theme` on next reload, self-correcting. Settings
  remains the place with full save/error feedback for this same field.
- Spotify link doesn't match the expected pattern: inline message under the input
  instead of `alert()`.

## Testing

Same as the rest of this repo: no automated test framework. Verify with
`npm run build` (type-checks the new components/route change), `npm run lint`, and a
manual `npm run dev` walkthrough: load `/app/focus-room` and confirm no sidebar is
shown and "Exit Focus Room" returns to `/app/dashboard`; run the timer through a
start/pause/skip cycle; confirm quotes rotate; paste a valid and an invalid Spotify
link; toggle a task and confirm it persists on reload; click a theme dot and confirm
both the page background updates immediately and `/app/settings` reflects the new
theme afterward (proving the shared `student_profiles.theme` write worked).
