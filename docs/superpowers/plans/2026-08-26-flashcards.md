# Flashcards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/app/flashcards` — manual deck/card creation, SM-2 spaced-repetition
review, and an AI-generate-from-past-papers flow that calls a new backend endpoint
(built separately, not in this repo).

**Architecture:** Three new pages (`FlashcardsPage` deck list, `DeckPage` single-deck
CRUD, `StudySessionPage` global review queue) plus one modal (`AiGenerateModal`),
all direct-Supabase except the AI-generate call, which hits a new backend endpoint
per the contract in the spec. SM-2 scheduling lives in one pure, dependency-free
module (`spacedRepetition.ts`) so the one piece of real algorithmic logic in this
feature is isolated and hand-checkable. New nav item and three router entries,
added incrementally (one per page task) so every task's build stays green.

**Tech Stack:** React 19, React Router v7, TypeScript (strict), `@supabase/supabase-js`,
plain CSS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-26-flashcards-design.md`

## Global Constraints

- No automated test framework exists in this repo — verify every task with
  `npm run build` (must exit 0) and `npm run lint` (oxlint, must exit 0). Do the
  full manual `npm run dev` walkthrough on the final task. Do not introduce a
  test framework.
- Follow existing conventions: direct `supabase.from(...)` calls in components,
  plain CSS classes, named exports, `toLocalISODate()` for all date math (never
  `.toISOString()` — this app has a documented history of UTC-boundary bugs).
- Card content is plain text only (front/back) — no rich text, no images.
- `computeNextReview` must be a pure function with no React/Supabase import.
- The backend endpoint (`POST /flashcards/generate`) is **not implemented in this
  repo**. `AiGenerateModal` calls it per the documented contract and handles the
  documented error cases (429 quota, `no_content`, network/5xx) — it will fail
  until the backend team builds the endpoint, and that's expected until then.
- Do not add a per-student "AI generations remaining" counter — the quota pool is
  shared across all students, not personal (see spec).

---

### Prerequisite (manual — not a coding task, run before Task 3, no git commit)

This repo has no migrations folder or Supabase CLI — schema changes are applied
by hand via the Supabase SQL editor (same as every previous feature: Settings'
`theme` column, Focus Room, Planner's `study_tasks`). **The project owner needs
to run this SQL in the Supabase SQL editor** before any page that reads/writes
these tables can be manually verified (it doesn't block `npm run build`/`lint`,
which don't touch the live database):

```sql
create table flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

alter table flashcard_decks enable row level security;

create policy "Students manage their own decks"
  on flashcard_decks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references flashcard_decks(id) on delete cascade,
  front text not null,
  back text not null,
  source text not null check (source in ('manual', 'ai')),
  interval int not null default 0,
  repetitions int not null default 0,
  ease_factor real not null default 2.5,
  due_date date not null default current_date,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table flashcards enable row level security;

create policy "Students manage cards in their own decks"
  on flashcards
  for all
  using (
    exists (
      select 1 from flashcard_decks
      where flashcard_decks.id = flashcards.deck_id
      and flashcard_decks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from flashcard_decks
      where flashcard_decks.id = flashcards.deck_id
      and flashcard_decks.user_id = auth.uid()
    )
  );
```

(The `gemini_daily_usage` counter table in the spec is backend-owned — out of
scope here, part of the hand-off to whoever builds `/flashcards/generate`.)

---

### Task 1: Foundation — types, SM-2 module, subjects list

**Files:**
- Create: `src/types/flashcard.ts`
- Create: `src/lib/spacedRepetition.ts`
- Create: `src/lib/subjects.ts`

**Interfaces:**
- Produces: `FlashcardDeck`, `Flashcard`, `NewFlashcard` types (Task 3–6 import
  these). `computeNextReview(quality: ReviewQuality, card: ReviewState, today?: Date): ReviewResult`
  and `type ReviewQuality = 0 | 3 | 4 | 5` (Task 6 imports both). `SUBJECTS` and
  `subjectsForProfile(profile: StudentProfile): string[]` (Task 5 imports
  `subjectsForProfile`).

- [ ] **Step 1: Create the Flashcard types**

```ts
// src/types/flashcard.ts
export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source: 'manual' | 'ai';
  interval: number;
  repetitions: number;
  ease_factor: number;
  due_date: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface NewFlashcard {
  deck_id: string;
  front: string;
  back: string;
  source: 'manual' | 'ai';
}
```

- [ ] **Step 2: Create the SM-2 module**

```ts
// src/lib/spacedRepetition.ts
import { toLocalISODate } from './date';

export type ReviewQuality = 0 | 3 | 4 | 5;

export interface ReviewState {
  interval: number;
  repetitions: number;
  ease_factor: number;
}

export interface ReviewResult extends ReviewState {
  due_date: string;
}

export function computeNextReview(
  quality: ReviewQuality,
  card: ReviewState,
  today: Date = new Date()
): ReviewResult {
  let { interval, repetitions, ease_factor } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
  }

  ease_factor = Math.max(
    1.3,
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    interval,
    repetitions,
    ease_factor,
    due_date: toLocalISODate(dueDate),
  };
}
```

- [ ] **Step 3: Create the subjects list**

Extracted from `public/legacy/chat.html`'s inline `SUBJECTS` object/selection
logic (search that file for `const SUBJECTS` to see the source being ported):

```ts
// src/lib/subjects.ts
import type { StudentProfile } from '../types/profile';

export const SUBJECTS: Record<string, string[]> = {
  OL: ['Mathematics', 'Science', 'English', 'Sinhala', 'History', 'Commerce', 'Geography', 'ICT'],
  science: ['Physics', 'Chemistry', 'Biology', 'Combined Mathematics'],
  commerce: ['Business Studies', 'Accounting', 'Economics'],
  arts: ['Political Science', 'Geography', 'History', 'Logic'],
  technology: ['Engineering Technology', 'Science for Technology', 'ICT'],
};

export function subjectsForProfile(profile: StudentProfile): string[] {
  if (profile.exam_type === 'OL') return SUBJECTS.OL;
  return (profile.stream && SUBJECTS[profile.stream]) || SUBJECTS.OL;
}
```

- [ ] **Step 4: Verify the SM-2 math by hand-checkable worked example**

No test framework exists, so verify with a one-off scratch script run via `tsx`
(fetched on demand via `npx`, not added as a dependency — nothing in
`package.json` changes). Create a temporary file at the repo root:

```ts
// scratch-verify-sm2.ts — TEMPORARY, do not commit, delete after this step
import { computeNextReview } from './src/lib/spacedRepetition';

const fixedToday = new Date(2026, 0, 1); // Jan 1, 2026 — fixed for reproducibility

console.log('-- Grading "Good" four times in a row --');
let card = { interval: 0, repetitions: 0, ease_factor: 2.5 };
for (let i = 0; i < 4; i++) {
  const result = computeNextReview(4, card, fixedToday);
  console.log(`Review ${i + 1}: interval=${result.interval} repetitions=${result.repetitions} ease_factor=${result.ease_factor} due_date=${result.due_date}`);
  card = result;
}

console.log('-- Grading "Again" after two Goods (failure resets) --');
let card2 = { interval: 0, repetitions: 0, ease_factor: 2.5 };
card2 = computeNextReview(4, card2, fixedToday);
card2 = computeNextReview(4, card2, fixedToday);
const failed = computeNextReview(0, card2, fixedToday);
console.log(`After Again: interval=${failed.interval} repetitions=${failed.repetitions} ease_factor=${failed.ease_factor} due_date=${failed.due_date}`);
```

Run: `npx tsx scratch-verify-sm2.ts`

Expected output (exact match required):
```
-- Grading "Good" four times in a row --
Review 1: interval=1 repetitions=1 ease_factor=2.5 due_date=2026-01-02
Review 2: interval=6 repetitions=2 ease_factor=2.5 due_date=2026-01-07
Review 3: interval=15 repetitions=3 ease_factor=2.5 due_date=2026-01-16
Review 4: interval=38 repetitions=4 ease_factor=2.5 due_date=2026-02-08
-- Grading "Again" after two Goods (failure resets) --
After Again: interval=1 repetitions=0 ease_factor=1.7000000000000002 due_date=2026-01-02
```
(The `1.7000000000000002` is ordinary floating-point noise from `2.5 - 0.8` —
expected, not a bug.)

If the output doesn't match, the SM-2 implementation in Step 2 has a bug — fix
it before continuing.

- [ ] **Step 5: Delete the scratch script**

```bash
rm scratch-verify-sm2.ts
```

- [ ] **Step 6: Build to confirm no errors**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/types/flashcard.ts src/lib/spacedRepetition.ts src/lib/subjects.ts
git commit -m "Add Flashcard types, SM-2 module, and subjects list"
```

---

### Task 2: `flashcards.css` foundation

**Files:**
- Create: `src/styles/flashcards.css`
- Modify: `src/main.tsx` (add the new stylesheet import)

**Interfaces:**
- Produces CSS classes consumed by Tasks 3–6: `.flashcards-page`,
  `.flashcards-top`, `.flashcards-title`, `.flashcards-sub`, `.flashcards-actions`,
  `.new-deck-btn`, `.study-now-btn` (`.disabled`), `.deck-grid`, `.deck-card`
  (`.deck-card-title`, `.deck-card-count`), `.deck-back-link`, `.deck-page-top`
  (`.deck-page-title`, `.deck-page-actions`), `.deck-delete-btn`, `.card-row`
  (`.card-row-front`, `.card-row-back`, `.card-row-source`), `.add-card-form`,
  `.ai-generate-overlay`, `.ai-generate-card`, `.ai-generate-title`,
  `.ai-subject-select`, `.ai-stage-row`, `.ai-stage-actions`, `.ai-stage-discard`,
  `.ai-generate-footer`, `.ai-generate-error`, `.study-session`,
  `.study-progress`, `.study-flip-card`, `.study-grade-buttons` (`.grade-again`,
  `.grade-hard`, `.grade-good`, `.grade-easy`), `.study-summary`. Also reuses
  `.task-empty` from `planner.css` (already global via `main.tsx`).

- [ ] **Step 1: Create the stylesheet**

```css
/* src/styles/flashcards.css */
.flashcards-page { max-width: 760px; }
.flashcards-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.flashcards-title { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; color: #2D1F4E; margin-bottom: 4px; }
.flashcards-sub { color: rgba(45,31,78,0.55); font-size: 14px; }
.flashcards-actions { display: flex; gap: 10px; }

.new-deck-btn, .study-now-btn {
  border: none; border-radius: 12px; padding: 12px 18px; font-size: 14px; font-weight: 700; cursor: pointer;
  text-decoration: none; display: inline-block;
}
.new-deck-btn { background: rgba(124,92,191,0.1); color: #7C5CBF; }
.study-now-btn { background: #7C5CBF; color: white; box-shadow: 0 8px 20px rgba(124,92,191,0.3); }
.study-now-btn.disabled { background: rgba(124,92,191,0.25); box-shadow: none; cursor: not-allowed; }

.deck-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.deck-card {
  background: #ffffff; border: 1px solid rgba(124,92,191,0.1); border-radius: 16px; padding: 20px;
  cursor: pointer; text-decoration: none; display: block; color: inherit; transition: border-color 0.2s;
}
.deck-card:hover { border-color: rgba(124,92,191,0.3); }
.deck-card-title { font-size: 16px; font-weight: 700; color: #2D1F4E; margin-bottom: 6px; }
.deck-card-count { font-size: 12px; color: rgba(45,31,78,0.55); }

.deck-back-link { display: inline-block; margin-bottom: 16px; font-size: 13px; color: #7C5CBF; text-decoration: none; font-weight: 600; }

.deck-page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.deck-page-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: #2D1F4E; }
.deck-page-actions { display: flex; gap: 10px; align-items: center; }
.deck-delete-btn { background: none; border: none; color: rgba(45,31,78,0.4); cursor: pointer; font-size: 13px; padding: 0; }

.card-row { background: #ffffff; border: 1px solid rgba(124,92,191,0.1); border-radius: 14px; padding: 16px 20px; margin-bottom: 10px; }
.card-row-front { font-size: 14px; font-weight: 700; color: #2D1F4E; margin-bottom: 6px; display: flex; align-items: center; }
.card-row-back { font-size: 13px; color: rgba(45,31,78,0.65); margin-bottom: 8px; }
.card-row-source { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #7C5CBF; margin-left: 8px; }

.add-card-form { background: #ffffff; border: 1px solid rgba(124,92,191,0.1); border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }
.add-card-form input, .add-card-form textarea {
  border: 1px solid rgba(124,92,191,0.2); border-radius: 10px; padding: 10px 12px; font-size: 14px; font-family: inherit;
}
.add-card-form button { align-self: flex-start; background: #7C5CBF; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-weight: 700; cursor: pointer; }

.ai-generate-overlay {
  position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px;
  background: rgba(45,31,78,0.3); backdrop-filter: blur(4px);
}
.ai-generate-card { width: 100%; max-width: 480px; max-height: 80vh; overflow-y: auto; background: white; border-radius: 20px; padding: 28px; }
.ai-generate-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: #2D1F4E; margin-bottom: 16px; }
.ai-subject-select { width: 100%; border: 1px solid rgba(124,92,191,0.2); border-radius: 10px; padding: 10px 12px; font-size: 14px; margin-bottom: 16px; }
.ai-stage-row { border: 1px solid rgba(124,92,191,0.15); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
.ai-stage-row textarea { width: 100%; border: none; font-size: 13px; font-family: inherit; resize: vertical; margin-bottom: 4px; }
.ai-stage-actions { display: flex; justify-content: flex-end; }
.ai-stage-discard { background: none; border: none; color: #D14F4F; font-size: 12px; cursor: pointer; }
.ai-generate-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.ai-generate-footer button { border-radius: 10px; padding: 10px 18px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; }
.ai-generate-footer button:first-child { background: rgba(124,92,191,0.08); color: #7C5CBF; }
.ai-generate-footer button:last-child { background: #7C5CBF; color: white; }
.ai-generate-footer button:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-generate-error { color: #D14F4F; font-size: 13px; margin-bottom: 12px; }

.study-session { max-width: 480px; margin: 0 auto; text-align: center; }
.study-progress { font-size: 13px; color: rgba(45,31,78,0.5); margin-bottom: 20px; }
.study-flip-card {
  background: white; border: 1px solid rgba(124,92,191,0.1); border-radius: 20px; padding: 48px 24px;
  min-height: 200px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 16px;
  font-size: 17px; font-weight: 600; color: #2D1F4E;
}
.study-grade-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.study-grade-buttons button { border: none; border-radius: 10px; padding: 12px 6px; font-size: 13px; font-weight: 700; cursor: pointer; color: white; }
.grade-again { background: #D14F4F; }
.grade-hard { background: #E08F1D; }
.grade-good { background: #7C5CBF; }
.grade-easy { background: #4A9E71; }
.study-summary { text-align: center; padding: 40px 20px; }
```

- [ ] **Step 2: Import the stylesheet in `main.tsx`**

Add `import './styles/flashcards.css';` to the existing block of stylesheet
imports in `src/main.tsx` (alongside `focus-room.css`, `planner.css`, etc.).

- [ ] **Step 3: Build to confirm no errors**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/styles/flashcards.css src/main.tsx
git commit -m "Add flashcards.css foundation"
```

---

### Task 3: `FlashcardsPage` — deck list, create deck, nav entry

**Files:**
- Create: `src/pages/app/FlashcardsPage.tsx`
- Modify: `src/router.tsx`
- Modify: `src/components/app-shell/Sidebar.tsx`

**Interfaces:**
- Consumes: `FlashcardDeck` type (Task 1), CSS classes from Task 2, `useAuth()`
  → `{ session }`, `supabase`, `toLocalISODate` from `src/lib/date.ts`.
- Produces: `export function FlashcardsPage()`, routed at `/app/flashcards`.

- [ ] **Step 1: Create `FlashcardsPage.tsx`**

```tsx
// src/pages/app/FlashcardsPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toLocalISODate } from '../../lib/date';
import type { FlashcardDeck } from '../../types/flashcard';

interface DeckWithCount extends FlashcardDeck {
  flashcards: { count: number }[];
}

export function FlashcardsPage() {
  const { session } = useAuth();
  const [decks, setDecks] = useState<DeckWithCount[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);

  const loadDecks = useCallback(async () => {
    if (!session) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('id,user_id,title,created_at,flashcards(count)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError(true);
      setDecks(null);
      return;
    }
    setDecks(data as DeckWithCount[]);
  }, [session]);

  const loadDueCount = useCallback(async () => {
    if (!session) return;
    const { count, error } = await supabase
      .from('flashcards')
      .select('id, flashcard_decks!inner(user_id)', { count: 'exact', head: true })
      .eq('flashcard_decks.user_id', session.user.id)
      .lte('due_date', toLocalISODate(new Date()));
    if (!error) setDueCount(count ?? 0);
  }, [session]);

  useEffect(() => {
    loadDecks();
    loadDueCount();
  }, [loadDecks, loadDueCount]);

  async function createDeck() {
    if (!session || !newDeckTitle.trim()) return;
    const { error } = await supabase
      .from('flashcard_decks')
      .insert({ user_id: session.user.id, title: newDeckTitle.trim() });
    if (error) return;
    setNewDeckTitle('');
    setShowNewDeckForm(false);
    await loadDecks();
  }

  return (
    <div className="flashcards-page">
      <div className="flashcards-top">
        <div>
          <div className="flashcards-title">Flashcards</div>
          <div className="flashcards-sub">Study with spaced repetition</div>
        </div>
        <div className="flashcards-actions">
          <button type="button" className="new-deck-btn" onClick={() => setShowNewDeckForm((v) => !v)}>
            + New deck
          </button>
          {dueCount > 0 ? (
            <Link to="/app/flashcards/study" className="study-now-btn">Study now ({dueCount})</Link>
          ) : (
            <button type="button" className="study-now-btn disabled" disabled>Study now</button>
          )}
        </div>
      </div>

      {showNewDeckForm && (
        <div className="add-card-form">
          <input
            type="text"
            placeholder="Deck name"
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createDeck(); }}
          />
          <button type="button" onClick={createDeck}>Create deck</button>
        </div>
      )}

      {loadError && <div className="task-empty">Couldn&apos;t load decks right now.</div>}
      {!loadError && decks === null && <div className="task-empty">Loading...</div>}
      {!loadError && decks !== null && decks.length === 0 && (
        <div className="task-empty">No decks yet — tap + New deck to create one.</div>
      )}
      {!loadError && decks !== null && decks.length > 0 && (
        <div className="deck-grid">
          {decks.map((deck) => (
            <Link key={deck.id} to={`/app/flashcards/${deck.id}`} className="deck-card">
              <div className="deck-card-title">{deck.title}</div>
              <div className="deck-card-count">{deck.flashcards[0]?.count ?? 0} cards</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

In `src/router.tsx`, inside the `AppLayout` children array (alongside
`dashboard`/`planner`/`progress`), add:

```ts
{ path: 'flashcards', lazy: () => import('./pages/app/FlashcardsPage').then((m) => ({ Component: m.FlashcardsPage })) },
```

- [ ] **Step 3: Add the sidebar nav item**

In `src/components/app-shell/Sidebar.tsx`, add a new entry to `NAV_ITEMS`
between Planner and Progress:

```ts
  {
    to: '/app/flashcards',
    label: 'Flashcards',
    path: 'M4 19.5V6a2 2 0 0 1 2-2h9l5 5v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2ZM14 4v5h5',
  },
```

- [ ] **Step 4: Build and lint**

Run: `npm run build`
Expected: exits 0.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/app/FlashcardsPage.tsx src/router.tsx src/components/app-shell/Sidebar.tsx
git commit -m "Add FlashcardsPage with deck list, create deck, and nav entry"
```

---

### Task 4: `DeckPage` — card list, manual add, delete deck

**Files:**
- Create: `src/pages/app/DeckPage.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: `Flashcard`/`FlashcardDeck` types (Task 1), CSS classes from Task 2.
- Produces: `export function DeckPage()`, routed at `/app/flashcards/:deckId`.
  Task 5 modifies this file to add the "Generate with AI" button.

- [ ] **Step 1: Create `DeckPage.tsx`**

```tsx
// src/pages/app/DeckPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { Flashcard, FlashcardDeck } from '../../types/flashcard';

export function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const loadDeck = useCallback(async () => {
    if (!session || !deckId) return;
    setLoadError(false);
    const [deckRes, cardsRes] = await Promise.all([
      supabase.from('flashcard_decks').select('id,user_id,title,created_at').eq('id', deckId).single(),
      supabase
        .from('flashcards')
        .select('id,deck_id,front,back,source,interval,repetitions,ease_factor,due_date,last_reviewed_at,created_at')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false }),
    ]);
    if (deckRes.error || cardsRes.error) {
      setLoadError(true);
      return;
    }
    setDeck(deckRes.data as FlashcardDeck);
    setCards(cardsRes.data as Flashcard[]);
  }, [session, deckId]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  async function addCard() {
    if (!deckId || !front.trim() || !back.trim()) return;
    const { error } = await supabase.from('flashcards').insert({
      deck_id: deckId,
      front: front.trim(),
      back: back.trim(),
      source: 'manual',
    });
    if (error) return;
    setFront('');
    setBack('');
    setShowAddForm(false);
    await loadDeck();
  }

  async function deleteCard(cardId: string) {
    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
    if (error) return;
    await loadDeck();
  }

  async function deleteDeck() {
    if (!deckId) return;
    await supabase.from('flashcard_decks').delete().eq('id', deckId);
    navigate('/app/flashcards');
  }

  if (loadError) return <div className="task-empty">Couldn&apos;t load this deck right now.</div>;
  if (!deck || cards === null) return <div className="task-empty">Loading...</div>;

  return (
    <div className="flashcards-page">
      <Link to="/app/flashcards" className="deck-back-link">&larr; All decks</Link>
      <div className="deck-page-top">
        <div className="deck-page-title">{deck.title}</div>
        <div className="deck-page-actions">
          <button type="button" className="new-deck-btn" onClick={() => setShowAddForm((v) => !v)}>
            + Add card
          </button>
          <button type="button" className="deck-delete-btn" onClick={deleteDeck}>Delete deck</button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-card-form">
          <input type="text" placeholder="Front" value={front} onChange={(e) => setFront(e.target.value)} />
          <textarea placeholder="Back" value={back} onChange={(e) => setBack(e.target.value)} rows={2} />
          <button type="button" onClick={addCard}>Save card</button>
        </div>
      )}

      {cards.length === 0 && <div className="task-empty">No cards yet — add one manually.</div>}
      {cards.map((card) => (
        <div className="card-row" key={card.id}>
          <div className="card-row-front">
            {card.front}
            {card.source === 'ai' && <span className="card-row-source">AI</span>}
          </div>
          <div className="card-row-back">{card.back}</div>
          <button type="button" className="ai-stage-discard" onClick={() => deleteCard(card.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

In `src/router.tsx`, alongside the `flashcards` entry added in Task 3:

```ts
{ path: 'flashcards/:deckId', lazy: () => import('./pages/app/DeckPage').then((m) => ({ Component: m.DeckPage })) },
```

- [ ] **Step 3: Build and lint**

Run: `npm run build`
Expected: exits 0.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/DeckPage.tsx src/router.tsx
git commit -m "Add DeckPage with card list, manual add, and delete deck"
```

---

### Task 5: `AiGenerateModal` and wiring into `DeckPage`

**Files:**
- Create: `src/components/flashcards/AiGenerateModal.tsx`
- Modify: `src/pages/app/DeckPage.tsx`

**Interfaces:**
- Consumes: `subjectsForProfile` (Task 1), `NewFlashcard` type (Task 1),
  `useAuth()` → `{ session, profile }`, `supabase`, CSS classes from Task 2.
- Produces: `export function AiGenerateModal({ deckId, onClose, onSaved }: { deckId: string; onClose: () => void; onSaved: () => void })`.
  `onSaved` is called after cards are successfully written to Supabase (caller
  should re-fetch); `onClose` is called on cancel or after a successful save.

- [ ] **Step 1: Create `AiGenerateModal.tsx`**

```tsx
// src/components/flashcards/AiGenerateModal.tsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { subjectsForProfile } from '../../lib/subjects';
import type { NewFlashcard } from '../../types/flashcard';

const BACKEND_URL = 'https://obscura-backend-production-d7de.up.railway.app';

interface StagedCard {
  front: string;
  back: string;
}

interface AiGenerateModalProps {
  deckId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AiGenerateModal({ deckId, onClose, onSaved }: AiGenerateModalProps) {
  const { session, profile } = useAuth();
  const subjects = profile ? subjectsForProfile(profile) : [];
  const [subject, setSubject] = useState(subjects[0] ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'staging' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [staged, setStaged] = useState<StagedCard[]>([]);

  async function generate() {
    if (!session || !profile || !subject) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`${BACKEND_URL}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session.user.id,
          subject,
          level: profile.exam_type,
          syllabus: profile.syllabus,
          medium: profile.medium,
          count: 10,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setErrorMessage(data.message || 'AI flashcards are at today’s limit — try again tomorrow.');
        setStatus('error');
        return;
      }
      if (!res.ok) {
        setErrorMessage('Something went wrong generating flashcards. Please try again.');
        setStatus('error');
        return;
      }
      if (data.reason === 'no_content' || !data.cards || data.cards.length === 0) {
        setErrorMessage('Not enough past-paper material for this subject yet.');
        setStatus('error');
        return;
      }
      setStaged(data.cards);
      setStatus('staging');
    } catch {
      setErrorMessage('Something went wrong generating flashcards. Please try again.');
      setStatus('error');
    }
  }

  function updateStaged(index: number, field: 'front' | 'back', value: string) {
    setStaged((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function discardStaged(index: number) {
    setStaged((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveAccepted() {
    if (staged.length === 0) return;
    const rows: NewFlashcard[] = staged.map((c) => ({ deck_id: deckId, front: c.front, back: c.back, source: 'ai' }));
    const { error } = await supabase.from('flashcards').insert(rows);
    if (error) {
      setErrorMessage('Could not save cards, please try again.');
      setStatus('error');
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="ai-generate-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ai-generate-card">
        <div className="ai-generate-title">Generate flashcards with AI</div>

        {errorMessage && <div className="ai-generate-error">{errorMessage}</div>}

        {status !== 'staging' && (
          <>
            <select className="ai-subject-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="ai-generate-footer">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="button" onClick={generate} disabled={status === 'loading' || !subject}>
                {status === 'loading' ? 'Generating...' : 'Generate 10 cards'}
              </button>
            </div>
          </>
        )}

        {status === 'staging' && (
          <>
            {staged.map((card, i) => (
              <div className="ai-stage-row" key={i}>
                <textarea value={card.front} onChange={(e) => updateStaged(i, 'front', e.target.value)} rows={2} />
                <textarea value={card.back} onChange={(e) => updateStaged(i, 'back', e.target.value)} rows={2} />
                <div className="ai-stage-actions">
                  <button type="button" className="ai-stage-discard" onClick={() => discardStaged(i)}>Discard</button>
                </div>
              </div>
            ))}
            <div className="ai-generate-footer">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="button" onClick={saveAccepted} disabled={staged.length === 0}>
                Save {staged.length} card{staged.length === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the modal into `DeckPage`**

In `src/pages/app/DeckPage.tsx`:

```ts
// before
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { Flashcard, FlashcardDeck } from '../../types/flashcard';
```

```ts
// after
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import type { Flashcard, FlashcardDeck } from '../../types/flashcard';
import { AiGenerateModal } from '../../components/flashcards/AiGenerateModal';
```

Add state, right after the existing `showAddForm` state:

```ts
// before
  const [showAddForm, setShowAddForm] = useState(false);
  const [front, setFront] = useState('');
```

```ts
// after
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [front, setFront] = useState('');
```

Add the button next to "+ Add card", and render the modal at the bottom:

```tsx
// before
          <button type="button" className="new-deck-btn" onClick={() => setShowAddForm((v) => !v)}>
            + Add card
          </button>
          <button type="button" className="deck-delete-btn" onClick={deleteDeck}>Delete deck</button>
        </div>
      </div>
```

```tsx
// after
          <button type="button" className="new-deck-btn" onClick={() => setShowAddForm((v) => !v)}>
            + Add card
          </button>
          <button type="button" className="new-deck-btn" onClick={() => setShowAiModal(true)}>
            Generate with AI
          </button>
          <button type="button" className="deck-delete-btn" onClick={deleteDeck}>Delete deck</button>
        </div>
      </div>
```

And just before the closing `</div>` of the component's returned JSX:

```tsx
// before
        </div>
      ))}
    </div>
  );
}
```

```tsx
// after
        </div>
      ))}

      {showAiModal && (
        <AiGenerateModal
          deckId={deckId!}
          onClose={() => setShowAiModal(false)}
          onSaved={loadDeck}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build and lint**

Run: `npm run build`
Expected: exits 0.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/flashcards/AiGenerateModal.tsx src/pages/app/DeckPage.tsx
git commit -m "Add AiGenerateModal with subject picker and staged-card review"
```

---

### Task 6: `StudySessionPage` — review queue and grading, final walkthrough

**Files:**
- Create: `src/pages/app/StudySessionPage.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: `computeNextReview`/`ReviewQuality` (Task 1), `Flashcard` type
  (Task 1), `toLocalISODate` (existing `src/lib/date.ts`), CSS classes from
  Task 2.
- Produces: `export function StudySessionPage()`, routed at
  `/app/flashcards/study` — this is the route `FlashcardsPage`'s "Study now"
  link (Task 3) already points to.

- [ ] **Step 1: Create `StudySessionPage.tsx`**

```tsx
// src/pages/app/StudySessionPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toLocalISODate } from '../../lib/date';
import { computeNextReview, type ReviewQuality } from '../../lib/spacedRepetition';
import type { Flashcard } from '../../types/flashcard';

interface GradeCounts { again: number; hard: number; good: number; easy: number; }

const GRADES: { label: string; quality: ReviewQuality; className: string; key: keyof GradeCounts }[] = [
  { label: 'Again', quality: 0, className: 'grade-again', key: 'again' },
  { label: 'Hard', quality: 3, className: 'grade-hard', key: 'hard' },
  { label: 'Good', quality: 4, className: 'grade-good', key: 'good' },
  { label: 'Easy', quality: 5, className: 'grade-easy', key: 'easy' },
];

export function StudySessionPage() {
  const { session } = useAuth();
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState<GradeCounts>({ again: 0, hard: 0, good: 0, easy: 0 });

  const loadQueue = useCallback(async () => {
    if (!session) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('flashcards')
      .select('id,deck_id,front,back,source,interval,repetitions,ease_factor,due_date,last_reviewed_at,created_at,flashcard_decks!inner(user_id)')
      .eq('flashcard_decks.user_id', session.user.id)
      .lte('due_date', toLocalISODate(new Date()))
      .order('due_date', { ascending: true });
    if (error) {
      setLoadError(true);
      return;
    }
    setQueue(data as Flashcard[]);
  }, [session]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function grade(quality: ReviewQuality, gradeKey: keyof GradeCounts) {
    if (!queue || queue.length === 0) return;
    const current = queue[0];
    const result = computeNextReview(quality, current);
    await supabase
      .from('flashcards')
      .update({
        interval: result.interval,
        repetitions: result.repetitions,
        ease_factor: result.ease_factor,
        due_date: result.due_date,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', current.id);
    setCounts((prev) => ({ ...prev, [gradeKey]: prev[gradeKey] + 1 }));
    setFlipped(false);
    setQueue((prev) => (prev ? prev.slice(1) : prev));
  }

  if (loadError) return <div className="task-empty">Couldn&apos;t load your review queue right now.</div>;
  if (queue === null) return <div className="task-empty">Loading...</div>;

  const totalReviewed = counts.again + counts.hard + counts.good + counts.easy;

  if (queue.length === 0) {
    return (
      <div className="study-session">
        <div className="study-summary">
          <div className="deck-page-title">
            {totalReviewed > 0 ? 'Session complete!' : 'Nothing due right now'}
          </div>
          {totalReviewed > 0 && (
            <div className="flashcards-sub">
              Reviewed {totalReviewed} card{totalReviewed === 1 ? '' : 's'} —{' '}
              {counts.again} again, {counts.hard} hard, {counts.good} good, {counts.easy} easy.
            </div>
          )}
          <Link to="/app/flashcards" className="new-deck-btn" style={{ display: 'inline-block', marginTop: 20 }}>
            Back to decks
          </Link>
        </div>
      </div>
    );
  }

  const current = queue[0];

  return (
    <div className="study-session">
      <div className="study-progress">{queue.length} card{queue.length === 1 ? '' : 's'} left</div>
      <div className="study-flip-card" onClick={() => setFlipped((f) => !f)}>
        {flipped ? current.back : current.front}
      </div>
      {!flipped && <div className="flashcards-sub" style={{ marginBottom: 16 }}>Tap the card to reveal the answer</div>}
      {flipped && (
        <div className="study-grade-buttons">
          {GRADES.map((g) => (
            <button key={g.key} type="button" className={g.className} onClick={() => grade(g.quality, g.key)}>
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

In `src/router.tsx`, alongside the other `flashcards*` entries:

```ts
{ path: 'flashcards/study', lazy: () => import('./pages/app/StudySessionPage').then((m) => ({ Component: m.StudySessionPage })) },
```

- [ ] **Step 3: Build and lint**

Run: `npm run build`
Expected: exits 0.

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Full manual walkthrough**

Requires the Prerequisite SQL to have been run in Supabase first. Run
`npm run dev`, log in with a test account that has completed onboarding and has
at least one ingested/`ready` past paper for one of its subjects, navigate to
`/app/flashcards`, then:

1. Confirm the deck list is empty with the "No decks yet" message and "Study
   now" is disabled (greyed out, unclickable).
2. Click "+ New deck", type a name, press Enter — confirm it appears in the
   grid with "0 cards".
3. Click into the deck, click "+ Add card", fill front/back, save — confirm
   the card appears in the list with no "AI" tag.
4. Click "Generate with AI", pick a subject, click "Generate 10 cards" —
   confirm either: staged cards appear (edit one, discard one, then "Save N
   cards" and confirm the remaining ones land in the deck list tagged "AI"), or
   (if the backend endpoint isn't live yet) a clear inline error appears
   instead of a silent failure or crash.
5. Go back to "All decks" — confirm the card count updated and "Study now" is
   now enabled showing a count.
6. Click "Study now" — confirm the first card's front shows, click it to flip
   to the back, confirm the four grade buttons only appear after flipping.
7. Grading the same card Good three times in a row to see the full 1 → 6 → 15
   day progression isn't practical in one sitting (it'd take 15+ days). Instead,
   grade one card with each of the four buttons across the due queue and, after
   each grade, check that card's deck view to confirm its `interval` matches a
   first-time review per the Task 1 Step 4 table (a first-time Good goes to
   `interval=1`, due tomorrow; a first-time Again also goes to `interval=1`, due
   tomorrow — classic SM-2 has no same-day relearning step, so this is expected,
   not a bug).
8. Grade every remaining due card until the queue empties — confirm the
   session-complete summary shows the right total and per-grade breakdown, and
   "Back to decks" navigates correctly.
9. Reload `/app/flashcards/study` with nothing due — confirm the "Nothing due
   right now" empty state (no crash, no infinite loading).
10. Delete a card from a deck — confirm it disappears immediately. Delete the
    deck itself — confirm it navigates back to the deck list and the deck is
    gone.

- [ ] **Step 5: Commit**

```bash
git add src/pages/app/StudySessionPage.tsx src/router.tsx
git commit -m "Add StudySessionPage with SM-2 grading and session summary"
```

---

## Self-Review Notes

**Spec coverage:** manual deck/card CRUD (Tasks 3–4), AI generate + staging
review (Task 5), backend contract (documented in spec, not a task here — out of
this repo's scope), SM-2 scheduling (Task 1 + Task 6), global "Study now" queue
(Task 6), quota-aware error handling in the modal (Task 5), nav entry (Task 3).
Out-of-scope items from the spec (deck sharing, rich text, manual SM-2 param
editing, notifications, undo) have no tasks, correctly.

**Type consistency checked:** `Flashcard`/`FlashcardDeck`/`NewFlashcard` (Task 1)
used identically in Tasks 3–6. `computeNextReview`/`ReviewQuality`/`ReviewState`/
`ReviewResult` (Task 1) match their usage in Task 6 exactly. `subjectsForProfile`
(Task 1) matches its one call site in Task 5.
