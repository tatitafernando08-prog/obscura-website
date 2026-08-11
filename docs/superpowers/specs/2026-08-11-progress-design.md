# Progress Page — Design

Date: 2026-08-11
Status: Approved

## Problem

`/app/progress` is currently a placeholder (`src/pages/app/ProgressPage.tsx`)
linking out to `public/legacy/progress.html`. That legacy page gives the student
a look at their study consistency: three summary stats, a 7-day completed-tasks
bar chart, and a "Recently Completed" activity feed — all derived from the same
`study_tasks` table that Focus Room, Planner, and Dashboard already read. Like
those three, it's pure Supabase + client-side logic — no dependency on the new
backend, which is still mid-flight on its own Phase 1.

This is the fifth React feature past the Phase 1 conversion, and the first one
that's purely a read/derive view — no CRUD, no navigation-target decisions,
just data summarization.

## Scope

**In scope:** full feature parity with `public/legacy/progress.html` — three
stat cards (tasks completed, completion rate, day streak, all over a rolling
30-day window), a "Last 7 Days" bar chart of completed-task counts, and a
"Recently Completed" list (up to 8 most recent completed tasks). Same
`study_tasks` table already in use — no new tables or columns.

**One fix carried forward, not a new deviation:** legacy computes "today" and
the 7/30-day windows via `d.toISOString().split('T')[0]`, which converts to UTC
first and silently shifts local-midnight boundaries for this app's actual users
(`Asia/Colombo`, UTC+5:30) — the same class of bug found and fixed during the
Planner build. This page uses `toLocalISODate()` throughout instead, per the
standing rule established there (see `src/lib/date.ts`).

**Deliberate parity choice (judgment call, not asking):** legacy's streak
counter walks backward from *today* and stops at the first day with no
completed task — meaning a long streak reads as 0 first thing in the morning
before today's task is done, rather than reporting yesterday's streak length.
This is preserved exactly as legacy behaves. It's a cosmetic/UX quirk, not a
data-correctness bug (unlike the timezone issue), so it doesn't warrant a
deviation the way the Dashboard page's dead-link fixes did.

**Everything else stays exact parity:**
- No creating/editing/deleting tasks from this page — Progress is read-only,
  same as legacy. Planner remains the only CRUD surface.
- No change to `public/legacy/progress.html` or any other still-legacy page.
- No `router.tsx` change — the `progress` route already points at this file.

## Architecture

**Layout** — standard `AppLayout` (sidebar shown), like Dashboard and Planner.

**Component split**, around one shared data source (last 30 days of
`study_tasks`, fetched once and derived three ways):
- `src/pages/app/ProgressPage.tsx` — fetches the 30-day task window once,
  derives all stat/chart/activity values from that single array, and composes
  the three sections below. Derivation lives here (not in a shared lib) since
  none of it is reused elsewhere, matching how `TodaysFocusCard` derived its
  own progress math inline on Dashboard.
- `src/components/progress/StatsGrid.tsx` — pure presentational: given
  `{ completed: number; rate: number; streak: number }`, renders the 3-card
  grid.
- `src/components/progress/WeeklyChart.tsx` — pure presentational: given
  `{ day: string; count: number }[]` (7 entries, oldest to newest), renders the
  bar chart + weekday labels.
- `src/components/progress/ActivityList.tsx` — pure presentational: given
  `tasks: StudyTask[] | null` (already filtered to completed + sliced to 8) and
  `loadError: boolean`, renders the activity rows or loading/empty/error state.

**Styling** — new `src/styles/progress.css` (added to `main.tsx`'s import
list), ported from legacy's `<style>` block. Reuses the shared default
`.app-main` width (legacy's progress page uses `max-width: 800px` inline on
`.app-main` — narrower than Dashboard's default; this becomes a scoped
override in `progress.css`, not a shared `app-shell.css` change).

## Data model

No changes. Reuses the existing `StudyTask` type from `src/types/task.ts`.

## Data flow

**Load** — on mount, `ProgressPage` runs one query:
```
supabase.from('study_tasks').select('id,title,subtitle,completed,task_date,scheduled_time')
  .eq('user_id', session.user.id).gte('task_date', toLocalISODate(thirtyDaysAgo))
  .order('task_date', { ascending: false })
```

**Derivations from the resulting `tasks` array** (all pure, computed in
`ProgressPage`):
- `completed = tasks.filter(t => t.completed)`
- **Stats**: `completed.length`; `rate = tasks.length ? round(completed.length / tasks.length * 100) : 0`; `streak` walks backward day-by-day from today via `toLocalISODate`, counting while that date is in the set of completed dates, stopping at the first miss (see parity note above).
- **Chart**: last 7 calendar days (oldest→newest), each day's count = completed tasks whose `task_date` matches that day's `toLocalISODate()`.
- **Activity list**: `completed` sorted by `task_date` descending (already the query order), sliced to the first 8.

## Error handling

- Task fetch fails: `ActivityList` shows "Couldn't load your activity right
  now." (equivalent to legacy's schedule-load error pattern from Dashboard);
  `StatsGrid` and `WeeklyChart` fall back to their zero/empty states — same
  asymmetry as Dashboard, where only the list-shaped section gets a distinct
  error message.

## Testing

Same as the rest of this repo: no automated test framework. Verify with
`npm run build`, `npm run lint`, and a manual `npm run dev` walkthrough:
confirm stats show 0/0%/0 with no tasks; complete a task in Planner for today,
reload Progress, confirm "Tasks completed" and "Completion rate" update, the
day streak becomes 1, today's bar in the chart shows a count, and the task
appears in Recently Completed; confirm the chart's 7 bars align with the
correct weekday labels; confirm an uncompleted task does not appear in the
activity list.
