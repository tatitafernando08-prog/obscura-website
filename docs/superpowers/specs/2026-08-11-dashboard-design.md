# Dashboard Page — Design

Date: 2026-08-11
Status: Approved

## Problem

`/app/dashboard` is currently a placeholder (`src/pages/app/DashboardPage.tsx`)
linking out to `public/legacy/dashboard.html`. That legacy page is the app's home
screen: a greeting, a "Today's Focus" progress card, a Quick Actions grid, and a
"Today's Schedule" list — both of the latter two data-bearing pieces reading the
same `study_tasks` table that Focus Room and Planner already use. Like those two,
it's pure Supabase + client-side logic — no dependency on the new backend, which is
still mid-flight on its own Phase 1.

This is the fourth React feature past the Phase 1 conversion, and the first one
whose data readers can show something real without a manual DB insert first —
`study_tasks` rows now actually exist because Planner shipped.

## Scope

**In scope:** full feature parity with `public/legacy/dashboard.html` — greeting,
"Today's Focus" progress card (today's task count + completion progress bar,
linking to Planner), a 6-card Quick Actions grid (3 real links, 3 "Soon" badges),
and a "Today's Schedule" list (read-only display of today's tasks). Same
`study_tasks` table already in use — no new tables or columns.

**Three deliberate deviations from legacy, confirmed during brainstorming** (legacy
predates Focus Room/Planner existing as real pages, so its links pointed at
marketing/dead targets that now have better destinations):
- Quick Actions' **Pomodoro** card: legacy links to the marketing homepage's
  `#pomodoro` "try it" widget → now links to `/app/focus-room`, the real working
  timer.
- Today's Schedule header's **"View all"** link: legacy is a dead `href="#"` → now
  links to `/app/planner`, the real task list.
- Quick Actions' **AI Assistant** card links to `/app/chat` (the existing
  placeholder route) instead of `/legacy/chat.html` — consistent with keeping
  navigation inside the React app now that the route exists, even though Chat
  itself isn't built yet (out of scope — needs the new backend's `/chat/ask`,
  still mid-flight, per the standing constraint on this work).

**Everything else stays exact parity:**
- Quick Actions' **Study Planner** card → `/app/planner` (same target as legacy
  intended, now real instead of legacy HTML).
- **Flashcards / Past Papers / Quick Search** stay non-functional "Soon" cards —
  rendered as plain non-interactive elements instead of legacy's dead `href="#"`
  links (a link that goes nowhere is worse than no link at all).
- No creating/editing/deleting tasks from this page — Dashboard is read-only,
  same as legacy. Planner remains the only CRUD surface.
- No change to `public/legacy/dashboard.html` or any other still-legacy page.

## Architecture

**Layout** — standard `AppLayout` (sidebar shown), like Planner and unlike Focus
Room. No `router.tsx` change — the `dashboard` route already points at this file.

**Component split**, around the one shared data source (today's `study_tasks`,
read once and passed down — avoids the two data-bearing sections firing separate
queries for the same rows):
- `src/pages/app/DashboardPage.tsx` — fetches today's tasks once, renders the
  greeting (`profile?.name` with email-prefix fallback, same pattern established
  in Focus Room and Planner), and composes the three sections below.
- `src/components/dashboard/TodaysFocusCard.tsx` — pure presentational: given
  `tasks: StudyTask[] | null`, renders the progress card (title, progress bar,
  label) or the empty state ("No tasks planned yet" / "Add tasks in Planner to get
  started"). No data fetching of its own.
- `src/components/dashboard/QuickActions.tsx` — fully static, no props at all: the
  6-card grid with real links for AI Assistant/Study Planner/Pomodoro and inert
  "Soon" cards for the rest.
- `src/components/dashboard/ScheduleList.tsx` — pure presentational: given
  `tasks: StudyTask[] | null` and `loadError: boolean`, renders the schedule rows
  (time, title, subtitle, completed styling) or loading/empty/error states.

**Styling** — new `src/styles/dashboard.css` (added to `main.tsx`'s import list),
ported from legacy's `<style>` block. No `.app-main` width override needed this
time — legacy's dashboard uses the shared default (1000px) as-is, unlike Planner's
720px override.

## Data model

No changes. Reuses the existing `StudyTask` type from `src/types/task.ts` (already
has `subtitle`, added during the Planner work) and the shared
`toLocalISODate()` helper from `src/lib/date.ts` — **not** `.toISOString()`, per
the timezone bug found and fixed in Planner (`.toISOString()`-based "today"
computation silently breaks for this app's actual users in `Asia/Colombo`,
UTC+5:30).

## Data flow

**Load** — on mount, `DashboardPage` runs one query:
```
supabase.from('study_tasks').select('id,title,subtitle,completed,task_date,scheduled_time')
  .eq('user_id', session.user.id).eq('task_date', toLocalISODate(new Date()))
  .order('scheduled_time', { ascending: true })
```
Identical shape to Focus Room's `TasksPanel` and Planner's per-day query, just
without a day selector — always "today." The resulting `tasks` array (or `null`
while loading, or the error flag) is passed straight down as props to both
`TodaysFocusCard` and `ScheduleList` — no separate fetch in either.

**Today's Focus card derivation** (from the same `tasks` array):
- `tasks === null` (loading) or `tasks.length === 0`: title "No tasks planned yet",
  label "Add tasks in Planner to get started", progress bar at 0%.
- Otherwise: title `` `Complete ${tasks.length} topic${tasks.length > 1 ? 's' : ''}` ``,
  label `` `${completed} / ${tasks.length} done` ``, progress bar width
  `(completed / tasks.length) * 100`.

**Schedule list** renders each task's `scheduled_time` (sliced to `HH:MM`, or
`--:--` if null), `title` (struck through if `completed`), and `subtitle` if
present — exactly legacy's row shape, no interactivity (no checkbox, no delete —
this is Planner's job).

## Error handling

- Task fetch fails: `ScheduleList` shows "Couldn't load your schedule right now."
  (verbatim from legacy); `TodaysFocusCard` falls back to its empty state (same
  as the "no tasks" case — legacy doesn't distinguish "no tasks" from "load
  failed" for the focus card either, only the schedule list gets a distinct error
  message).

## Testing

Same as the rest of this repo: no automated test framework. Verify with
`npm run build`, `npm run lint`, and a manual `npm run dev` walkthrough: confirm
the greeting shows the Settings-configured name; add a task for today via
Planner, reload Dashboard, and confirm both the focus card's progress and the
schedule list reflect it; mark it complete in Planner and confirm Dashboard's
strikethrough/progress update on reload; click the Pomodoro quick-action and
confirm it opens Focus Room; click "View all" and confirm it opens Planner;
confirm the three "Soon" cards are inert (no navigation, no `#` in the URL bar).
