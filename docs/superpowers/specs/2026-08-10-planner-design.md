# Planner Page — Design

Date: 2026-08-10
Status: Approved

## Problem

`/app/planner` is currently a placeholder (`src/pages/app/PlannerPage.tsx`) linking
out to `public/legacy/planner.html`. That legacy page is the only place in the whole
app — legacy or React — where a user can actually *create* a `study_tasks` row.
Dashboard and Progress (both still legacy placeholders equivalents in React) and the
just-shipped Focus Room `TasksPanel` are all read-only consumers of that same table.
Without Planner, `study_tasks` stays empty for any real user, which was the deciding
factor in picking this over Dashboard as the next feature (see conversation — Focus
Room's Today's Tasks panel could only be tested by inserting a row directly via the
Supabase REST API, since there's no in-app way to create one yet).

Like Settings and Focus Room, this is pure Supabase + client-side logic — no
dependency on the new backend, which is still mid-flight on its own Phase 1.

## Scope

**In scope:** full feature parity with `public/legacy/planner.html` — a Mon–Sun
day selector (current week only), a task list for the selected day (toggle complete,
delete), an "Add a task" modal (title required, subtitle/time optional), a task
counter, and a CTA linking to Focus Room. Same `study_tasks` table Focus Room
already reads (`id`, `user_id`, `title`, `subtitle`, `task_date`, `scheduled_time`,
`completed`) — no new tables or columns.

**Out of scope (explicitly), both confirmed during brainstorming:**
- Week navigation (prev/next week arrows). Legacy only ever shows the current
  Mon–Sun week; that limitation is kept as-is.
- Delete confirmation. Legacy deletes immediately on clicking the delete (×) button
  with no "are you sure" step; that stays as-is — low-stakes data, consistent with
  the rest of the app's lightweight interactions.
- Editing an existing task's title/subtitle/time after creation. Legacy doesn't
  support this either (only toggle-complete and delete) — not added here.
- Any change to `public/legacy/planner.html` or the other still-legacy pages
  (`dashboard.html`, `progress.html`) that also read `study_tasks`.

## Architecture

**Layout** — unlike Focus Room, Planner stays inside the standard `AppLayout`
(sidebar shown) — no router restructuring needed, since the legacy page itself uses
the same sidebar shell as every other `/app/*` page. `router.tsx`'s existing
`planner` entry inside the `AppLayout` children is unchanged; only
`PlannerPage.tsx`'s contents change.

**Component split:**
- `src/pages/app/PlannerPage.tsx` — owns `selectedDate` and `tasks` state (the two
  things every other piece of this page depends on), renders the day selector, task
  list (checkbox + delete rows inline — these are tightly coupled to the page's
  toggle/delete handlers, so extracting a separate `TaskRow` component would just
  add prop-plumbing without real isolation benefit), the "+" button, the
  `AddTaskModal`, and the Focus Room CTA.
- `src/components/planner/DaySelector.tsx` — pure presentational: given a selected
  ISO date and an `onSelect(date: Date)` callback, computes and renders the current
  Mon–Sun week. No data fetching of its own.
- `src/components/planner/AddTaskModal.tsx` — controlled overlay: owns its own
  title/subtitle/time input state internally (reset each time it opens), calls
  `onSave(title, subtitle, time)` on submit and `onClose()` on cancel/backdrop
  click/successful save. Parent (`PlannerPage`) only controls whether it's open.

**Styling** — new `src/styles/planner.css` (added to `main.tsx`'s import list,
same pattern as `focus-room.css`), ported from legacy's `<style>` block. One
deliberate deviation: legacy's `.app-main { max-width: 720px; }` override is
**not** applied to the shared `.app-main` rule in `app-shell.css` (that class is
used by every `/app/*` page — narrowing it globally would shrink Dashboard/Chat/
Progress/Settings too). Instead, a `.planner-page` wrapper div inside `PlannerPage`
carries its own `max-width: 720px`, scoping the narrower layout to this page only.

## Data model

`src/types/task.ts`'s `StudyTask` gains the one field Planner needs that Focus
Room's narrower `.select()` didn't fetch:

```ts
export interface StudyTask {
  id: string;
  title: string;
  subtitle: string | null;
  completed: boolean;
  task_date: string;
  scheduled_time: string | null;
}
```

Plus a new type for inserts, mirroring the `NewStudentProfile` pattern already
established for onboarding — legacy's `POST` body never includes `completed`
(the column defaults to `false` at the DB level, same as it did for the row Focus
Room's walkthrough tested against):

```ts
export interface NewStudyTask {
  user_id: string;
  title: string;
  subtitle: string | null;
  scheduled_time: string | null;
  task_date: string;
}
```

## Data flow

**Load** — on mount and whenever `selectedDate` changes:
```
supabase.from('study_tasks').select('id,title,subtitle,completed,task_date,scheduled_time')
  .eq('user_id', session.user.id).eq('task_date', selectedISODate)
  .order('scheduled_time', { ascending: true })
```
Same shape as `TasksPanel`'s query, just parameterized by the selected day instead
of always "today".

**Toggle** — `update({ completed: !task.completed }).eq('id', task.id)`, then
re-fetch the day's list. No optimistic UI, matching `TasksPanel`'s existing
approach.

**Delete** — `delete().eq('id', task.id)`, then re-fetch. No confirmation step
(per the approved scope decision).

**Add** — `AddTaskModal` collects title (required, trimmed — Save is a no-op on
empty title, matching legacy's `if (!title) return;` guard) plus optional
subtitle/time, calls back up to `PlannerPage`, which does:
```
supabase.from('study_tasks').insert({
  user_id: session.user.id,
  title,
  subtitle: subtitle || null,
  scheduled_time: time || null,
  task_date: selectedISODate,
})
```
then closes the modal and re-fetches.

## Error handling

- Day's task list fails to load: inline "Couldn't load tasks right now." (verbatim
  from legacy), same as `TasksPanel`.
- Toggle/delete fail: logged to console, list left as-is — legacy doesn't
  surface these as user-facing errors either (fire-and-forget), matching
  `TasksPanel`'s precedent for the same table.
- Add-task fails: **inline error text in the modal** instead of legacy's blocking
  `alert()` — same call already made for Focus Room's Spotify link validation.
  Modal stays open with the entered values intact so the user doesn't lose their
  input.

## Testing

Same as the rest of this repo: no automated test framework. Verify with
`npm run build`, `npm run lint`, and a manual `npm run dev` walkthrough: switch
between days in the selector and confirm the task list and counter update; add a
task with all three fields, then one with only a title; toggle a task complete and
confirm it persists on reload; delete a task and confirm it's gone; click the Focus
Room CTA and confirm it navigates to `/app/focus-room`; confirm a task added here
shows up in Focus Room's Today's Tasks panel when added for today's date (proving
both pages genuinely share `study_tasks`).
