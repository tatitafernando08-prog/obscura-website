# Focus Room Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/app/focus-room` placeholder with a full-parity React port of `public/legacy/focus-room.html`: clock/greeting, Pomodoro timer, rotating quotes, a swappable Spotify embed, and a Today's Tasks checklist — rendered full-screen (no sidebar), with the theme picker now writing straight to `student_profiles.theme`.

**Architecture:** Five small, independently-testable components under `src/components/focus-room/` (timer, quotes, Spotify panel, tasks panel) composed by a rewritten `src/pages/app/FocusRoomPage.tsx`, which also owns clock/greeting/theme state. `/app/focus-room` moves out of the `AppLayout` (sidebar) branch in `src/router.tsx` to be a sibling route, so it renders full-viewport like the legacy page. Styling is a direct port of the legacy `<style>` block into `src/styles/focus-room.css`.

**Tech Stack:** React 19, React Router v7, TypeScript (strict), `@supabase/supabase-js`, plain CSS.

## Global Constraints

- No automated test framework exists in this repo — verify every task with `npm run build` (must exit 0) and `npm run lint` (oxlint, must exit 0), plus a manual `npm run dev` browser check on the final task. Do not introduce a test framework.
- Follow existing conventions: direct `supabase.from(...)` calls in components (no new API/service layer), plain CSS classes, `lazy: () => import(...)` routes, named exports (`export function X()`) matching every other page/component in this repo.
- No app-shell theming — `theme` only affects Focus Room's own visuals, never the sidebar/dashboard. Out of scope per the approved design spec.
- No new tables/columns. `study_tasks` (existing) is read/written for `completed` only — no create/edit/delete of tasks from this page.
- No Pomodoro session persistence — `sessionCount` stays in-memory only, matching legacy.
- Do not modify `public/legacy/focus-room.html` or any other `public/legacy/*.html` file.
- Spec reference: `docs/superpowers/specs/2026-08-09-focus-room-design.md`.

---

### Task 1: Foundation — `StudyTask` type and `focus-room.css`

**Files:**
- Create: `src/types/task.ts`
- Create: `src/styles/focus-room.css`
- Modify: `src/main.tsx:7-9` (add the new stylesheet import)

**Interfaces:**
- Produces: `StudyTask` type (`{ id: string; title: string; completed: boolean; task_date: string; scheduled_time: string | null }`), imported by Task 5's `TasksPanel.tsx` as `import type { StudyTask } from '../../types/task'`. CSS classes produced (consumed by Tasks 2–6): `.focus-room`, `.focus-room.theme-{pink,owl,green}`, `.focus-blob` (`.b1`/`.b2`/`.b3`), `.focus-exit`, `.theme-picker`, `.theme-dot` (`.purple`/`.pink`/`.owl`/`.green`/`.active`), `.focus-body`, `.focus-content`, `.focus-clock`, `.focus-greeting`, `.focus-timer-card`, `.focus-timer-label`, `.focus-timer-clock`, `.focus-timer-controls`, `.focus-btn` (`.primary`/`.secondary`), `.focus-quote-wrap`, `.focus-quote-text`, `.focus-quote-author`, `.focus-side`, `.glass-panel`, `.panel-title`, `.focus-task-row`, `.focus-task-check` (`.done`), `.focus-task-title` (`.done`), `.focus-tasks-empty`, `.spotify-swap`, `.focus-spotify-error`.

- [ ] **Step 1: Create the `StudyTask` type**

```ts
// src/types/task.ts
export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  task_date: string;
  scheduled_time: string | null;
}
```

- [ ] **Step 2: Create `focus-room.css`**

This is a direct port of `public/legacy/focus-room.html`'s `<style>` block (colors/gradients copied verbatim), with two deliberate changes: the legacy `html, body { height: 100%; overflow: hidden; }` rule is **dropped** (this file is now imported globally into an SPA with many other routes — that rule would break scrolling on every other page; `.focus-room`'s own `height: 100vh; overflow: hidden;` is sufficient to create the same full-viewport effect on its own route), and `@keyframes drift` is renamed to `@keyframes focus-drift` (defensive naming now that this shares a global stylesheet scope with the rest of the app).

```css
/* src/styles/focus-room.css */
.focus-room {
  position: relative;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(160deg, #2D1F4E 0%, #4A3470 45%, #7C5CBF 100%);
  overflow: hidden;
  transition: background 0.6s ease;
}
.focus-room.theme-pink { background: linear-gradient(160deg, #4E1F3A 0%, #8A3D63 45%, #D96BA0 100%); }
.focus-room.theme-owl  { background: linear-gradient(160deg, #0B0F2E 0%, #171B3D 45%, #2E3364 100%); }
.focus-room.theme-green{ background: linear-gradient(160deg, #123024 0%, #1F5240 45%, #3F9C77 100%); }

.focus-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  animation: focus-drift 18s ease-in-out infinite;
  transition: background 0.6s ease;
}
.focus-blob.b1 { width: 420px; height: 420px; background: #A87FE0; top: -100px; left: -80px; animation-duration: 22s; }
.focus-blob.b2 { width: 340px; height: 340px; background: #7C5CBF; bottom: -80px; right: -60px; animation-duration: 26s; animation-delay: -6s; }
.focus-blob.b3 { width: 260px; height: 260px; background: #F0EBFF; bottom: 20%; left: 15%; animation-duration: 20s; animation-delay: -3s; opacity: 0.15; }

.theme-pink .focus-blob.b1 { background: #F2A6C8; }
.theme-pink .focus-blob.b2 { background: #D96BA0; }
.theme-owl  .focus-blob.b1 { background: #4B5AAF; }
.theme-owl  .focus-blob.b2 { background: #2E3364; }
.theme-green .focus-blob.b1 { background: #6FD9A8; }
.theme-green .focus-blob.b2 { background: #3F9C77; }

@keyframes focus-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}

.focus-exit {
  position: absolute; top: 24px; left: 24px; z-index: 5;
  display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; font-weight: 600;
  background: rgba(255,255,255,0.1); padding: 10px 18px; border-radius: 100px;
  backdrop-filter: blur(10px); transition: background 0.2s;
}
.focus-exit:hover { background: rgba(255,255,255,0.18); }
.focus-exit svg { width: 16px; height: 16px; }

.theme-picker {
  position: absolute; top: 24px; right: 24px; z-index: 5;
  display: flex; gap: 8px;
  background: rgba(255,255,255,0.1); padding: 8px; border-radius: 100px;
  backdrop-filter: blur(10px);
}
.theme-dot {
  width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
  border: 2px solid transparent; transition: border-color 0.2s;
}
.theme-dot.active { border-color: white; }
.theme-dot.purple { background: #7C5CBF; }
.theme-dot.pink { background: #D96BA0; }
.theme-dot.owl { background: #2E3364; }
.theme-dot.green { background: #3F9C77; }

.focus-body {
  position: relative; z-index: 2; height: 100%;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; gap: 40px;
}

.focus-content { display: flex; flex-direction: column; align-items: center; color: white; }
.focus-clock { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 500; opacity: 0.85; margin-bottom: 6px; }
.focus-greeting { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; margin-bottom: 32px; text-align: center; }

.focus-timer-card {
  background: rgba(255,255,255,0.1); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 28px;
  padding: 40px 56px; text-align: center; margin-bottom: 24px;
}
.focus-timer-label { font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; margin-bottom: 12px; }
.focus-timer-clock { font-family: 'Space Grotesk', sans-serif; font-size: 72px; font-weight: 700; line-height: 1; margin-bottom: 24px; }
.focus-timer-controls { display: flex; gap: 12px; justify-content: center; }
.focus-btn { border: none; border-radius: 100px; padding: 12px 28px; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform 0.15s, background 0.2s; }
.focus-btn:hover { transform: translateY(-1px); }
.focus-btn.primary { background: white; color: #2D1F4E; }
.focus-btn.secondary { background: rgba(255,255,255,0.15); color: white; }

.focus-quote-wrap {
  max-width: 320px; text-align: center; margin-bottom: 8px; min-height: 80px;
  transition: opacity 0.4s ease;
}
.focus-quote-text {
  font-size: 19px; font-style: italic; font-weight: 500;
  color: rgba(255,255,255,0.9); line-height: 1.5; margin-bottom: 8px;
}
.focus-quote-author {
  font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 600;
}

.focus-side {
  display: flex; flex-direction: column; gap: 20px; width: 320px; flex-shrink: 0;
}
.glass-panel {
  background: rgba(255,255,255,0.08); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 20px; color: white;
}
.panel-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-bottom: 14px; }

.focus-task-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 14px; }
.focus-task-check { width: 18px; height: 18px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.5); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.focus-task-check.done { background: white; border-color: white; }
.focus-task-check.done svg { width: 12px; height: 12px; color: #7C5CBF; }
.focus-task-title { flex: 1; }
.focus-task-title.done { text-decoration: line-through; opacity: 0.5; }
.focus-tasks-empty { font-size: 13px; opacity: 0.6; }

.spotify-swap {
  display: flex; gap: 6px; margin-bottom: 12px;
}
.spotify-swap input {
  flex: 1; padding: 8px 12px; border-radius: 100px; border: none;
  background: rgba(255,255,255,0.15); color: white; font-size: 12px; outline: none;
}
.spotify-swap input::placeholder { color: rgba(255,255,255,0.5); }
.spotify-swap button {
  border: none; border-radius: 100px; padding: 8px 14px; font-size: 12px;
  font-weight: 600; background: white; color: #2D1F4E; cursor: pointer;
}
.focus-spotify-error {
  font-size: 12px; color: #FFD1DC; margin: -6px 0 12px;
}

@media (max-width: 1000px) {
  .focus-body { flex-direction: column; overflow-y: auto; padding: 90px 20px 24px; }
  .focus-side { width: 100%; max-width: 360px; }
}
@media (max-width: 600px) {
  .focus-timer-card { padding: 28px 32px; }
  .focus-timer-clock { font-size: 52px; }
  .focus-greeting { font-size: 22px; }
}
```

- [ ] **Step 3: Import the stylesheet in `main.tsx`**

```ts
// before
import './style.css';
import './styles/app-shell.css';
import './styles/onboarding.css';
```

```ts
// after
import './style.css';
import './styles/app-shell.css';
import './styles/onboarding.css';
import './styles/focus-room.css';
```

- [ ] **Step 4: Build to confirm no errors**

Run: `npm run build`
Expected: exits 0. (Nothing renders these styles yet — this only confirms the new files are valid and don't break the build.)

- [ ] **Step 5: Commit**

```bash
git add src/types/task.ts src/styles/focus-room.css src/main.tsx
git commit -m "Add StudyTask type and focus-room.css foundation"
```

---

### Task 2: `PomodoroTimer` component

**Files:**
- Create: `src/components/focus-room/PomodoroTimer.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.focus-timer-card`, `.focus-timer-label`, `.focus-timer-clock`, `.focus-timer-controls`, `.focus-btn`).
- Produces: `export function PomodoroTimer()` — no props, no external state. Consumed by Task 6's `FocusRoomPage.tsx` as `<PomodoroTimer />`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/focus-room/PomodoroTimer.tsx
import { useEffect, useReducer } from 'react';

const FOCUS_LEN = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionCount: number;
}

type TimerAction = { type: 'tick' } | { type: 'toggleRun' } | { type: 'skip' };

const initialState: TimerState = {
  secondsLeft: FOCUS_LEN,
  isRunning: false,
  isBreak: false,
  sessionCount: 0,
};

function advance(state: TimerState): TimerState {
  if (!state.isBreak) {
    const sessionCount = state.sessionCount + 1;
    return {
      ...state,
      isBreak: true,
      sessionCount,
      secondsLeft: sessionCount % 4 === 0 ? LONG_BREAK : SHORT_BREAK,
    };
  }
  return { ...state, isBreak: false, secondsLeft: FOCUS_LEN };
}

function reducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'tick':
      return state.secondsLeft <= 0 ? advance(state) : { ...state, secondsLeft: state.secondsLeft - 1 };
    case 'toggleRun':
      return { ...state, isRunning: !state.isRunning };
    case 'skip':
      return advance(state);
    default:
      return state;
  }
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PomodoroTimer() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [state.isRunning]);

  const label = state.isBreak
    ? (state.sessionCount % 4 === 0 ? 'Long Break' : 'Short Break')
    : 'Focus Session';

  return (
    <div className="focus-timer-card">
      <div className="focus-timer-label">{label}</div>
      <div className="focus-timer-clock">{formatTime(state.secondsLeft)}</div>
      <div className="focus-timer-controls">
        <button type="button" className="focus-btn primary" onClick={() => dispatch({ type: 'toggleRun' })}>
          {state.isRunning ? 'Pause' : 'Start'}
        </button>
        <button type="button" className="focus-btn secondary" onClick={() => dispatch({ type: 'skip' })}>
          Skip
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0. (Not rendered anywhere yet — Task 6 wires it up — but must compile standalone.)

- [ ] **Step 3: Commit**

```bash
git add src/components/focus-room/PomodoroTimer.tsx
git commit -m "Add PomodoroTimer component"
```

---

### Task 3: `QuoteRotator` component

**Files:**
- Create: `src/components/focus-room/QuoteRotator.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.focus-quote-wrap`, `.focus-quote-text`, `.focus-quote-author`).
- Produces: `export function QuoteRotator()` — no props. Consumed by Task 6 as `<QuoteRotator />`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/focus-room/QuoteRotator.tsx
import { useEffect, useState } from 'react';

const QUOTES = [
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'You are never too old to set another goal.', author: 'C.S. Lewis' },
  { text: 'Success is the sum of small efforts repeated.', author: 'Robert Collier' },
];

export function QuoteRotator() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="focus-quote-wrap" style={{ opacity: visible ? 1 : 0 }}>
      <p className="focus-quote-text">&quot;{quote.text}&quot;</p>
      <p className="focus-quote-author">— {quote.author}</p>
    </div>
  );
}
```

- [ ] **Step 2: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/focus-room/QuoteRotator.tsx
git commit -m "Add QuoteRotator component"
```

---

### Task 4: `SpotifyPanel` component

**Files:**
- Create: `src/components/focus-room/SpotifyPanel.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.glass-panel`, `.panel-title`, `.spotify-swap`, `.focus-spotify-error`).
- Produces: `export function SpotifyPanel()` — no props. Consumed by Task 6 as `<SpotifyPanel />`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/focus-room/SpotifyPanel.tsx
import { useState } from 'react';

const DEFAULT_EMBED_SRC = 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0';
const SPOTIFY_LINK_PATTERN = /open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/;

export function SpotifyPanel() {
  const [embedSrc, setEmbedSrc] = useState(DEFAULT_EMBED_SRC);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  function handleLoad() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const match = trimmed.match(SPOTIFY_LINK_PATTERN);
    if (!match) {
      setError("That doesn't look like a Spotify playlist, album, or track link.");
      return;
    }
    setError('');
    setEmbedSrc(`https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`);
  }

  return (
    <div className="glass-panel">
      <div className="panel-title">Now Playing</div>
      <div className="spotify-swap">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste a Spotify playlist link..."
        />
        <button type="button" onClick={handleLoad}>Load</button>
      </div>
      {error && <p className="focus-spotify-error">{error}</p>}
      <iframe
        title="Spotify player"
        style={{ borderRadius: 12 }}
        src={embedSrc}
        width="100%"
        height={152}
        frameBorder={0}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
```

- [ ] **Step 2: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/focus-room/SpotifyPanel.tsx
git commit -m "Add SpotifyPanel component"
```

---

### Task 5: `TasksPanel` component

**Files:**
- Create: `src/components/focus-room/TasksPanel.tsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ session }` from `src/context/AuthContext.tsx` (existing); `supabase` from `src/lib/supabaseClient.ts` (existing); `StudyTask` from `src/types/task.ts` (Task 1); CSS classes from Task 1 (`.glass-panel`, `.panel-title`, `.focus-task-row`, `.focus-task-check`, `.focus-task-title`, `.focus-tasks-empty`).
- Produces: `export function TasksPanel()` — no props. Consumed by Task 6 as `<TasksPanel />`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/focus-room/TasksPanel.tsx
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { StudyTask } from '../../types/task';

function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

export function TasksPanel() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!session) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('study_tasks')
      .select('id,title,completed,task_date,scheduled_time')
      .eq('user_id', session.user.id)
      .eq('task_date', todayISODate())
      .order('scheduled_time', { ascending: true });
    if (error) {
      setLoadError(true);
      setTasks(null);
      return;
    }
    setTasks(data as StudyTask[]);
  }, [session]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function toggleTask(task: StudyTask) {
    try {
      const { error } = await supabase
        .from('study_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);
      if (error) throw error;
      await loadTasks();
    } catch (err) {
      console.error('Could not update task', err);
    }
  }

  return (
    <div className="glass-panel">
      <div className="panel-title">Today&apos;s Tasks</div>
      {loadError && <div className="focus-tasks-empty">Couldn&apos;t load tasks right now.</div>}
      {!loadError && tasks === null && <div className="focus-tasks-empty">Loading...</div>}
      {!loadError && tasks !== null && tasks.length === 0 && (
        <div className="focus-tasks-empty">No tasks planned for today yet.</div>
      )}
      {!loadError && tasks !== null && tasks.map((task) => (
        <div className="focus-task-row" key={task.id}>
          <div
            className={`focus-task-check${task.completed ? ' done' : ''}`}
            onClick={() => toggleTask(task)}
          >
            {task.completed && (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className={`focus-task-title${task.completed ? ' done' : ''}`}>{task.title}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build to confirm it type-checks**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/focus-room/TasksPanel.tsx
git commit -m "Add TasksPanel component"
```

---

### Task 6: `FocusRoomPage` assembly, routing, and full walkthrough

**Files:**
- Modify (full rewrite): `src/pages/app/FocusRoomPage.tsx`
- Modify: `src/router.tsx:24-41` (move `focus-room` out of the `AppLayout` children into a sibling of it)

**Interfaces:**
- Consumes: `PomodoroTimer` (Task 2), `QuoteRotator` (Task 3), `SpotifyPanel` (Task 4), `TasksPanel` (Task 5); `useAuth()` → `{ session, profile, refreshProfile }` from `AuthContext`; `supabase` from `src/lib/supabaseClient.ts`; `ThemeName` from `src/types/profile.ts`; `Link` from `react-router-dom`.
- Produces: `export function FocusRoomPage()`, consumed by `router.tsx`'s `focus-room` route as `m.FocusRoomPage`.

- [ ] **Step 1: Rewrite `FocusRoomPage.tsx`**

```tsx
// src/pages/app/FocusRoomPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { ThemeName } from '../../types/profile';
import { PomodoroTimer } from '../../components/focus-room/PomodoroTimer';
import { QuoteRotator } from '../../components/focus-room/QuoteRotator';
import { SpotifyPanel } from '../../components/focus-room/SpotifyPanel';
import { TasksPanel } from '../../components/focus-room/TasksPanel';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'owl', label: 'Owl' },
  { value: 'green', label: 'Green' },
];

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function greetingName(name: string | null | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return email ? email.split('@')[0] : 'there';
}

export function FocusRoomPage() {
  const { session, profile, refreshProfile } = useAuth();
  const [theme, setTheme] = useState<ThemeName>(profile?.theme ?? 'purple');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  async function handleThemeClick(value: ThemeName) {
    setTheme(value);
    if (!session) return;
    const { error } = await supabase
      .from('student_profiles')
      .update({ theme: value })
      .eq('id', session.user.id);
    if (!error) {
      await refreshProfile();
    }
  }

  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const name = greetingName(profile?.name, session?.user.email);

  return (
    <div className={`focus-room${theme !== 'purple' ? ` theme-${theme}` : ''}`}>
      <div className="focus-blob b1" />
      <div className="focus-blob b2" />
      <div className="focus-blob b3" />

      <Link to="/app/dashboard" className="focus-exit">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Exit Focus Room
      </Link>

      <div className="theme-picker">
        {THEMES.map((t) => (
          <div
            key={t.value}
            className={`theme-dot ${t.value}${theme === t.value ? ' active' : ''}`}
            title={t.label}
            onClick={() => handleThemeClick(t.value)}
          />
        ))}
      </div>

      <div className="focus-body">
        <div className="focus-content">
          <div className="focus-clock">{formatClock(now)}</div>
          <div className="focus-greeting">{`Good ${timeOfDay}, ${name}.`}</div>

          <PomodoroTimer />
          <QuoteRotator />
        </div>

        <div className="focus-side">
          <SpotifyPanel />
          <TasksPanel />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Move the `focus-room` route out of `AppLayout`'s children**

In `src/router.tsx`, `focus-room` currently lives inside the `AppLayout` branch (which renders the sidebar). Move it to be a sibling of that branch instead, so it renders standalone:

```tsx
// before
  {
    path: '/app',
    element: <ProtectedRoute require="profile" />,
    children: [
      {
        lazy: () => import('./layouts/AppLayout').then((m) => ({ Component: m.AppLayout })),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', lazy: () => import('./pages/app/DashboardPage').then((m) => ({ Component: m.DashboardPage })) },
          { path: 'chat', lazy: () => import('./pages/app/ChatPage').then((m) => ({ Component: m.ChatPage })) },
          { path: 'planner', lazy: () => import('./pages/app/PlannerPage').then((m) => ({ Component: m.PlannerPage })) },
          { path: 'focus-room', lazy: () => import('./pages/app/FocusRoomPage').then((m) => ({ Component: m.FocusRoomPage })) },
          { path: 'progress', lazy: () => import('./pages/app/ProgressPage').then((m) => ({ Component: m.ProgressPage })) },
          { path: 'settings', lazy: () => import('./pages/app/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
        ],
      },
    ],
  },
```

```tsx
// after
  {
    path: '/app',
    element: <ProtectedRoute require="profile" />,
    children: [
      { path: 'focus-room', lazy: () => import('./pages/app/FocusRoomPage').then((m) => ({ Component: m.FocusRoomPage })) },
      {
        lazy: () => import('./layouts/AppLayout').then((m) => ({ Component: m.AppLayout })),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', lazy: () => import('./pages/app/DashboardPage').then((m) => ({ Component: m.DashboardPage })) },
          { path: 'chat', lazy: () => import('./pages/app/ChatPage').then((m) => ({ Component: m.ChatPage })) },
          { path: 'planner', lazy: () => import('./pages/app/PlannerPage').then((m) => ({ Component: m.PlannerPage })) },
          { path: 'progress', lazy: () => import('./pages/app/ProgressPage').then((m) => ({ Component: m.ProgressPage })) },
          { path: 'settings', lazy: () => import('./pages/app/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
        ],
      },
    ],
  },
```

(`Sidebar.tsx` needs no change — its "Focus Room" `NavLink` already points to `/app/focus-room`, which still resolves correctly under the new nesting; it just no longer renders the sidebar around itself.)

- [ ] **Step 3: Build and lint**

Run: `npm run build`
Expected: exits 0, no TypeScript errors.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Full manual walkthrough**

Run `npm run dev`, log in with a test account that has completed onboarding, then:

1. Click "Focus Room" in the sidebar (or navigate to `/app/focus-room`) — confirm the page renders full-screen with **no sidebar**, the animated background blobs, clock, and a greeting using the account's Settings name (or the email prefix if no name is set).
2. Click a different theme dot — confirm the background gradient changes immediately, then open `/app/settings` in the same session and confirm it shows the same new theme selected (proving the shared `student_profiles.theme` write worked, and — thanks to the earlier `ProtectedRoute` fix — the Focus Room page did not flash to a blank "Loading..." screen when it happened).
3. Click "Start" on the timer — confirm it counts down every second; click "Pause" — confirm it stops; click "Skip" — confirm it jumps to "Short Break" (or "Long Break" on the 4th cycle) immediately.
4. Confirm the quote text changes after ~20 seconds (or reduce `20000` to `3000` temporarily in `QuoteRotator.tsx` to verify faster, then revert — do not commit a temporary interval change).
5. Paste a valid Spotify link (e.g. `https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn`) into the Now Playing box and click "Load" — confirm the embed updates. Paste something invalid (e.g. `not a link`) — confirm the inline error message appears instead of a browser `alert()`.
6. In "Today's Tasks", toggle a task's checkbox (create one first via the Supabase table editor if none exist for today, with `task_date` = today's date and your test account's `user_id`) — confirm it shows as completed (checkmark + strikethrough) and stays that way after reloading the page.
7. Click "Exit Focus Room" — confirm it navigates to `/app/dashboard` with the sidebar back.

- [ ] **Step 5: Commit**

```bash
git add src/pages/app/FocusRoomPage.tsx src/router.tsx
git commit -m "Assemble FocusRoomPage and move /app/focus-room to a full-screen route"
```
