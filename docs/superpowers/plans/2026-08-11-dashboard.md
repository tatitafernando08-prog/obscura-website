# Dashboard Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/app/dashboard` placeholder with a full-parity React port of `public/legacy/dashboard.html` — greeting, Today's Focus progress card, Quick Actions grid, and Today's Schedule list, all reading the same `study_tasks` table Focus Room and Planner already use.

**Architecture:** Three presentational components (`TodaysFocusCard`, `QuickActions`, `ScheduleList`) composed by a rewritten `src/pages/app/DashboardPage.tsx`, which owns the single shared fetch of today's tasks (both `TodaysFocusCard` and `ScheduleList` derive their view from the same array — no duplicate queries). Stays inside the existing `AppLayout` sidebar route (`router.tsx` needs no change). Styling is a direct port of the legacy `<style>` block into a new `src/styles/dashboard.css`.

**Tech Stack:** React 19, React Router v7, TypeScript (strict), `@supabase/supabase-js`, plain CSS.

## Global Constraints

- No automated test framework exists in this repo — verify every task with `npm run build` (must exit 0) and `npm run lint` (oxlint, must exit 0), plus a manual `npm run dev` browser check on the final task. Do not introduce a test framework.
- Follow existing conventions: direct `supabase.from(...)` calls, plain CSS classes, named exports.
- Use `toLocalISODate()` from `src/lib/date.ts` for "today" — never `.toISOString()` directly (the timezone bug fixed during the Planner work).
- Dashboard is read-only — no create/edit/delete/toggle of tasks here. Planner remains the only CRUD surface.
- Three links deliberately point at real routes instead of legacy's marketing/dead targets (approved in the design spec): Quick Actions' Pomodoro card → `/app/focus-room` (not the legacy homepage anchor); Today's Schedule's "View all" → `/app/planner` (not legacy's dead `#`); Quick Actions' AI Assistant → `/app/chat` (existing placeholder route, not `/legacy/chat.html`). Everything else is exact parity.
- Do not modify `public/legacy/dashboard.html` or any other `public/legacy/*.html` file.
- Spec reference: `docs/superpowers/specs/2026-08-11-dashboard-design.md`.

---

### Task 1: Foundation — `dashboard.css`

**Files:**
- Create: `src/styles/dashboard.css`
- Modify: `src/main.tsx:7-11` (add the new stylesheet import)

**Interfaces:**
- Produces CSS classes consumed by Tasks 2–5: `.app-top-row`, `.app-greeting`, `.app-greeting-sub`, `.focus-card` (`.focus-card-text`/`.focus-card-label`/`.focus-card-title`/`.focus-progress-bar`/`.focus-progress-fill`/`.focus-progress-label`/`.focus-card-icon`), `.section-heading`, `.quick-actions-grid`, `.quick-action-card`, `.quick-action-icon` (`.purple`/`.blue`/`.green`/`.red`/`.orange`/`.teal`), `.quick-action-title`, `.quick-action-sub`, `.quick-action-badge`, `.schedule-header`, `.schedule-list`, `.schedule-row`, `.schedule-time`, `.schedule-info`, `.schedule-title` (`.completed`), `.schedule-sub`, `.schedule-dot`, `.schedule-empty`.

- [ ] **Step 1: Create `dashboard.css`**

Direct port of `public/legacy/dashboard.html`'s `<style>` block (colors/spacing copied verbatim), excluding the app-shell rules already in `app-shell.css` (`.app-shell`, `.app-sidebar`, `.app-nav-item`, `.app-main`, etc. — this page reuses those, no override needed since legacy's dashboard uses the shared default `.app-main` width as-is). `.focus-card`'s legacy inline `style="text-decoration:none;"` moves into the class itself.

```css
/* src/styles/dashboard.css */
.app-top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.app-greeting { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; color: #2D1F4E; margin-bottom: 6px; }
.app-greeting-sub { color: rgba(45,31,78,0.6); }

.focus-card {
  background: linear-gradient(135deg, #7C5CBF 0%, #9B7ED9 100%);
  border-radius: 20px; padding: 28px 32px; color: white;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 32px; box-shadow: 0 16px 40px rgba(124,92,191,0.25);
  text-decoration: none;
}
.focus-card-text { flex: 1; }
.focus-card-label { font-size: 14px; opacity: 0.85; margin-bottom: 4px; }
.focus-card-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 16px; }
.focus-progress-bar {
  width: 100%; max-width: 340px; height: 8px;
  background: rgba(255,255,255,0.3); border-radius: 100px; overflow: hidden; margin-bottom: 8px;
}
.focus-progress-fill { height: 100%; background: #ffffff; border-radius: 100px; transition: width 0.4s ease; }
.focus-progress-label { font-size: 13px; opacity: 0.85; }
.focus-card-icon {
  width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 16px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 20px;
}
.focus-card-icon svg { width: 32px; height: 32px; }

.section-heading { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: #2D1F4E; margin-bottom: 16px; }
.quick-actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
.quick-action-card {
  background: #ffffff; border: 1px solid rgba(124,92,191,0.1); border-radius: 16px;
  padding: 20px; text-decoration: none; display: block; position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}
.quick-action-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(124,92,191,0.12); }
.quick-action-icon {
  width: 40px; height: 40px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
}
.quick-action-icon svg { width: 20px; height: 20px; }
.quick-action-icon.purple { background: rgba(124,92,191,0.12); color: #7C5CBF; }
.quick-action-icon.blue   { background: rgba(74,144,217,0.12); color: #3A7FC7; }
.quick-action-icon.green  { background: rgba(91,184,138,0.12); color: #4A9E71; }
.quick-action-icon.red    { background: rgba(224,92,92,0.12); color: #D14F4F; }
.quick-action-icon.orange { background: rgba(245,166,35,0.12); color: #E08F1D; }
.quick-action-icon.teal   { background: rgba(72,196,196,0.12); color: #34ABAB; }
.quick-action-title { font-size: 14px; font-weight: 600; color: #2D1F4E; margin-bottom: 2px; }
.quick-action-sub { font-size: 12px; color: rgba(45,31,78,0.5); }
.quick-action-badge {
  position: absolute; top: 16px; right: 16px; font-size: 10px; font-weight: 700;
  color: rgba(124,92,191,0.6); background: rgba(124,92,191,0.08); padding: 2px 8px; border-radius: 100px;
}

.schedule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.schedule-header a { font-size: 13px; color: #7C5CBF; font-weight: 600; text-decoration: none; }
.schedule-list { background: #ffffff; border: 1px solid rgba(124,92,191,0.1); border-radius: 16px; overflow: hidden; }
.schedule-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-bottom: 1px solid rgba(124,92,191,0.08); }
.schedule-row:last-child { border-bottom: none; }
.schedule-time { font-size: 13px; color: rgba(45,31,78,0.5); width: 70px; flex-shrink: 0; }
.schedule-info { flex: 1; }
.schedule-title { font-size: 14px; font-weight: 600; color: #2D1F4E; }
.schedule-title.completed { text-decoration: line-through; color: rgba(45,31,78,0.4); }
.schedule-sub { font-size: 12px; color: rgba(45,31,78,0.5); }
.schedule-dot { width: 8px; height: 8px; border-radius: 50%; background: #7C5CBF; flex-shrink: 0; }
.schedule-empty { padding: 32px 20px; text-align: center; color: rgba(45,31,78,0.5); font-size: 14px; }

@media (max-width: 900px) {
  .quick-actions-grid { grid-template-columns: 1fr 1fr; }
  .focus-card { flex-direction: column; align-items: flex-start; gap: 16px; }
  .focus-card-icon { margin-left: 0; }
}
```

- [ ] **Step 2: Import the stylesheet in `main.tsx`**

```ts
// before
import './styles/planner.css';
```

```ts
// after
import './styles/planner.css';
import './styles/dashboard.css';
```

- [ ] **Step 3: Build to confirm no errors**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/styles/dashboard.css src/main.tsx
git commit -m "Add dashboard.css foundation"
```

---

### Task 2: `TodaysFocusCard` component

**Files:**
- Create: `src/components/dashboard/TodaysFocusCard.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.focus-card` and children); `StudyTask` from `src/types/task.ts` (existing); `Link` from `react-router-dom`.
- Produces: `export function TodaysFocusCard({ tasks }: { tasks: StudyTask[] | null })` — pure presentational, no data fetching. Treats `tasks === null` (still loading) and `tasks.length === 0` identically as the empty state, matching legacy (which doesn't distinguish "no tasks" from "not loaded yet" for this card). Consumed by Task 5's `DashboardPage.tsx` as `<TodaysFocusCard tasks={tasks} />`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/dashboard/TodaysFocusCard.tsx
import { Link } from 'react-router-dom';
import type { StudyTask } from '../../types/task';

interface TodaysFocusCardProps {
  tasks: StudyTask[] | null;
}

export function TodaysFocusCard({ tasks }: TodaysFocusCardProps) {
  const total = tasks?.length ?? 0;
  const completed = tasks?.filter((t) => t.completed).length ?? 0;
  const hasTasks = total > 0;

  const title = hasTasks ? `Complete ${total} topic${total > 1 ? 's' : ''}` : 'No tasks planned yet';
  const label = hasTasks ? `${completed} / ${total} done` : 'Add tasks in Planner to get started';
  const progress = hasTasks ? (completed / total) * 100 : 0;

  return (
    <Link to="/app/planner" className="focus-card">
      <div className="focus-card-text">
        <div className="focus-card-label">Today&apos;s Focus</div>
        <div className="focus-card-title">{title}</div>
        <div className="focus-progress-bar">
          <div className="focus-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="focus-progress-label">{label}</div>
      </div>
      <div className="focus-card-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="white">
          <path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0. (Not rendered anywhere yet — Task 5 wires it up — but must compile standalone.)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/TodaysFocusCard.tsx
git commit -m "Add TodaysFocusCard component"
```

---

### Task 3: `QuickActions` component

**Files:**
- Create: `src/components/dashboard/QuickActions.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.section-heading`, `.quick-actions-grid`, `.quick-action-card`, `.quick-action-icon`, `.quick-action-title`, `.quick-action-sub`, `.quick-action-badge`); `Link` from `react-router-dom`.
- Produces: `export function QuickActions()` — no props, fully static. Consumed by Task 5 as `<QuickActions />`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/dashboard/QuickActions.tsx
import { Link } from 'react-router-dom';

export function QuickActions() {
  return (
    <>
      <div className="section-heading">Quick Actions</div>
      <div className="quick-actions-grid">
        <Link to="/app/chat" className="quick-action-card">
          <div className="quick-action-icon purple">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
            </svg>
          </div>
          <div className="quick-action-title">AI Assistant</div>
          <div className="quick-action-sub">Chat with NESH</div>
        </Link>

        <Link to="/app/planner" className="quick-action-card">
          <div className="quick-action-icon blue">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x={4} y={5} width={16} height={15} rx={2} stroke="currentColor" strokeWidth={1.8} />
              <path d="M4 9.5h16" stroke="currentColor" strokeWidth={1.8} />
            </svg>
          </div>
          <div className="quick-action-title">Study Planner</div>
          <div className="quick-action-sub">Plan your day</div>
        </Link>

        <div className="quick-action-card">
          <span className="quick-action-badge">Soon</span>
          <div className="quick-action-icon green">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x={5.5} y={7.5} width={12} height={14} rx={2} transform="rotate(-8 11.5 14.5)" stroke="currentColor" strokeWidth={1.7} />
            </svg>
          </div>
          <div className="quick-action-title">Flashcards</div>
          <div className="quick-action-sub">Review cards</div>
        </div>

        <Link to="/app/focus-room" className="quick-action-card">
          <div className="quick-action-icon red">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx={12} cy={13} r={8} stroke="currentColor" strokeWidth={1.8} />
              <path d="M12 9v4l2.6 2.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="quick-action-title">Pomodoro</div>
          <div className="quick-action-sub">Focus timer</div>
        </Link>

        <div className="quick-action-card">
          <span className="quick-action-badge">Soon</span>
          <div className="quick-action-icon orange">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 3.5h8l3 3v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
            </svg>
          </div>
          <div className="quick-action-title">Past Papers</div>
          <div className="quick-action-sub">Practice now</div>
        </div>

        <div className="quick-action-card">
          <span className="quick-action-badge">Soon</span>
          <div className="quick-action-icon teal">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx={10.5} cy={10.5} r={6.5} stroke="currentColor" strokeWidth={1.8} />
              <path d="M15.3 15.3 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </div>
          <div className="quick-action-title">Quick Search</div>
          <div className="quick-action-sub">Smart search</div>
        </div>
      </div>
    </>
  );
}
```

Note: the three "Soon" cards are plain `<div>`s (no `href`, no `onClick`) — intentionally non-interactive, unlike legacy's dead `href="#"` links.

- [ ] **Step 2: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/QuickActions.tsx
git commit -m "Add QuickActions component"
```

---

### Task 4: `ScheduleList` component

**Files:**
- Create: `src/components/dashboard/ScheduleList.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.schedule-header`, `.schedule-list`, `.schedule-row`, `.schedule-time`, `.schedule-info`, `.schedule-title`, `.schedule-sub`, `.schedule-dot`, `.schedule-empty`); `StudyTask` from `src/types/task.ts`; `Link` from `react-router-dom`.
- Produces: `export function ScheduleList({ tasks, loadError }: { tasks: StudyTask[] | null; loadError: boolean })` — pure presentational, no data fetching, no interactivity (no checkbox/delete — Planner's job). Consumed by Task 5 as `<ScheduleList tasks={tasks} loadError={loadError} />`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/dashboard/ScheduleList.tsx
import { Link } from 'react-router-dom';
import type { StudyTask } from '../../types/task';

interface ScheduleListProps {
  tasks: StudyTask[] | null;
  loadError: boolean;
}

export function ScheduleList({ tasks, loadError }: ScheduleListProps) {
  return (
    <>
      <div className="schedule-header">
        <div className="section-heading" style={{ marginBottom: 0 }}>Today&apos;s Schedule</div>
        <Link to="/app/planner">View all</Link>
      </div>
      <div className="schedule-list">
        {loadError && <div className="schedule-empty">Couldn&apos;t load your schedule right now.</div>}
        {!loadError && tasks === null && <div className="schedule-empty">Loading today&apos;s schedule...</div>}
        {!loadError && tasks !== null && tasks.length === 0 && (
          <div className="schedule-empty">No tasks planned for today yet.</div>
        )}
        {!loadError && tasks !== null && tasks.map((task) => (
          <div className="schedule-row" key={task.id}>
            <div className="schedule-time">{task.scheduled_time ? task.scheduled_time.slice(0, 5) : '--:--'}</div>
            <div className="schedule-info">
              <div className={`schedule-title${task.completed ? ' completed' : ''}`}>{task.title}</div>
              {task.subtitle && <div className="schedule-sub">{task.subtitle}</div>}
            </div>
            <div className="schedule-dot" />
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ScheduleList.tsx
git commit -m "Add ScheduleList component"
```

---

### Task 5: `DashboardPage` assembly and full walkthrough

**Files:**
- Modify (full rewrite): `src/pages/app/DashboardPage.tsx`

**Interfaces:**
- Consumes: `TodaysFocusCard` (Task 2), `QuickActions` (Task 3), `ScheduleList` (Task 4); `useAuth()` → `{ session, profile }` from `AuthContext`; `supabase` from `src/lib/supabaseClient.ts`; `toLocalISODate` from `src/lib/date.ts`; `StudyTask` from `src/types/task.ts`.
- Produces: `export function DashboardPage()`, already wired to the `dashboard` route in `router.tsx` (no router change needed).

- [ ] **Step 1: Rewrite `DashboardPage.tsx`**

```tsx
// src/pages/app/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toLocalISODate } from '../../lib/date';
import type { StudyTask } from '../../types/task';
import { TodaysFocusCard } from '../../components/dashboard/TodaysFocusCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { ScheduleList } from '../../components/dashboard/ScheduleList';

function greetingName(name: string | null | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return email ? email.split('@')[0] : 'there';
}

export function DashboardPage() {
  const { session, profile } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoadError(false);
      const { data, error } = await supabase
        .from('study_tasks')
        .select('id,title,subtitle,completed,task_date,scheduled_time')
        .eq('user_id', session.user.id)
        .eq('task_date', toLocalISODate(new Date()))
        .order('scheduled_time', { ascending: true });
      if (error) {
        setLoadError(true);
        setTasks(null);
        return;
      }
      setTasks(data as StudyTask[]);
    })();
  }, [session]);

  const name = greetingName(profile?.name, session?.user.email);

  return (
    <>
      <div className="app-top-row">
        <div>
          <div className="app-greeting">Welcome back, {name}!</div>
          <p className="app-greeting-sub">Let&apos;s make today productive.</p>
        </div>
      </div>

      <TodaysFocusCard tasks={tasks} />
      <QuickActions />
      <ScheduleList tasks={tasks} loadError={loadError} />
    </>
  );
}
```

- [ ] **Step 2: Build and lint**

Run: `npm run build`
Expected: exits 0, no TypeScript errors.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 3: Full manual walkthrough**

Run `npm run dev`, log in with a test account that has completed onboarding, navigate to `/app/dashboard`, then:

1. Confirm the greeting reads "Welcome back, {Settings name}!" (or the email prefix if no name is set).
2. If no tasks exist for today: confirm Today's Focus shows "No tasks planned yet" / "Add tasks in Planner to get started" at 0% progress, and Today's Schedule shows "No tasks planned for today yet."
3. Go to `/app/planner`, add a task for today (with a time and subtitle), come back to `/app/dashboard` (reload) — confirm Today's Focus now shows "Complete 1 topic" / "0 / 1 done" and Today's Schedule shows the row with the correct time, title, and subtitle.
4. Mark that task complete in Planner, reload Dashboard — confirm the progress bar fills, the label reads "1 / 1 done", and the schedule row shows strikethrough.
5. Click the Today's Focus card — confirm it navigates to `/app/planner`.
6. Click the "AI Assistant" quick action — confirm it navigates to `/app/chat` (shows the existing placeholder).
7. Click "Study Planner" — confirm it navigates to `/app/planner`.
8. Click "Pomodoro" — confirm it navigates to `/app/focus-room` (the real timer, not the marketing homepage).
9. Confirm "Flashcards", "Past Papers", and "Quick Search" show "Soon" badges and are not clickable (no navigation, no `#` appended to the URL).
10. Click "View all" next to Today's Schedule — confirm it navigates to `/app/planner`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/DashboardPage.tsx
git commit -m "Assemble DashboardPage with focus card, quick actions, and schedule list"
```
