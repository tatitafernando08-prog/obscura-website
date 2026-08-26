# Flashcards — Design

Date: 2026-08-26
Status: Approved

## Problem

Students have no way to build and review flashcard decks. Two related but
independent needs: (1) manual deck/card creation, which is pure CRUD like every
other `/app/*` feature so far (Planner's `study_tasks`, Settings), and (2)
AI-generated cards drawn from the past papers the backend has already ingested
and embedded (`papers`/`paper_chunks`), which requires calling the backend's
Gemini-backed pipeline the same way `chat.html`'s `/chat/ask` does. Spaced
repetition (SM-2) drives how often a card comes back up during review.

Confirmed with the backend session (not guessed): retrieval over `paper_chunks`
already exists as a reusable `RagService` gRPC module
(`HybridSearchService.retrieveCandidates()` — pgvector cosine + full-text search,
fused via RRF, reranked with Cohere) — a new endpoint calls the same
`RAG_GRPC_CLIENT`, no retrieval logic to duplicate. The harder constraint: **there
is no Gemini usage tracking anywhere in the codebase today**, and the real ceiling
is Google's free-tier **20 requests/day for the whole account**, shared across
chat, PDF ingestion, and now flashcards — already causing the backend team pain.
This design treats that as a hard constraint, not an afterthought.

## Scope

**In scope:**
- Manual deck creation (student-named, free-form — not locked to a subject
  taxonomy) and manual card creation (front/back plain text) inside a deck.
- AI-generated cards: student picks a subject, backend retrieves relevant chunks
  for that subject (using their profile's level/syllabus/medium) and generates
  one batch of 10 front/back cards via a single Gemini call. Generated cards are
  staged for review (accept/edit/discard each) before anything is saved.
- A global daily Gemini-usage counter, shared across features, with a small
  slice reserved for flashcards specifically (proposed default: 5 of the 20).
- SM-2 spaced repetition: Again/Hard/Good/Easy grading during review, driving
  each card's next-due date.
- A global "Study now" queue — pulls every due card across all of a student's
  decks into one review session (not per-deck only).
- New top-level sidebar nav item, `/app/flashcards`.

**Out of scope (v1, explicit):**
- Deck sharing between students.
- Rich text or images on cards — front/back are plain text only.
- Manually editing a card's SM-2 parameters (interval/ease factor) by hand.
- Per-deck due-card notifications/reminders.
- Undo after grading a card in a review session.
- Configurable AI batch size or subject-level filters beyond "subject" — level/
  syllabus/medium always come from the student's own profile, never a separate
  picker.

## Architecture

**Ownership split:** this repo (frontend) owns deck/card CRUD and the review UI —
all direct Supabase, no new backend involvement, same pattern as Planner. AI
generation requires a **new backend endpoint** this repo does not implement;
the API contract below is the hand-off artifact for whoever builds it (backend
session, per the user).

**Routing** (`src/router.tsx`) — new entries inside the existing `AppLayout`
children block, alongside `dashboard`/`planner`/`progress`:
```
{ path: 'flashcards', lazy: () => import('./pages/app/FlashcardsPage')... }
{ path: 'flashcards/:deckId', lazy: () => import('./pages/app/DeckPage')... }
{ path: 'flashcards/study', lazy: () => import('./pages/app/StudySessionPage')... }
```
`StudySessionPage` stays inside `AppLayout` (sidebar visible) rather than going
full-screen like Focus Room — review sessions are short and the student may want
to bail back to the deck list mid-session.

**New sidebar nav item** (`src/components/app-shell/Sidebar.tsx`) — added to
`NAV_ITEMS` between Planner and Progress, `to: '/app/flashcards'`, label
"Flashcards".

**Component split:**
- `src/pages/app/FlashcardsPage.tsx` — deck list (title + card count each),
  "+ New deck" (inline name prompt, same lightweight pattern as Planner's add
  flow), "Study now" button (disabled/hidden when zero cards are due).
- `src/pages/app/DeckPage.tsx` — single deck: card list, "+ Add card" form,
  "Generate with AI" button, delete deck.
- `src/components/flashcards/AiGenerateModal.tsx` — subject picker → calls
  backend → staging list (accept/edit/discard per card) → "Save N cards" writes
  accepted cards into the current deck. Owns its own staged-cards state
  in-memory only (see Data flow) — nothing persisted until "Save".
- `src/pages/app/StudySessionPage.tsx` — full review loop: fetch due queue once
  on mount, one card at a time (flip on click), four grade buttons, summary
  screen when the queue is empty.
- `src/lib/spacedRepetition.ts` — pure function, no React/Supabase dependency:
  ```ts
  export type ReviewQuality = 0 | 3 | 4 | 5; // Again / Hard / Good / Easy

  export function computeNextReview(
    quality: ReviewQuality,
    card: { interval: number; repetitions: number; ease_factor: number }
  ): { interval: number; repetitions: number; ease_factor: number; due_date: string }
  ```
  Standard SM-2: quality < 3 resets `repetitions` to 0 and `interval` to 1 day.
  quality ≥ 3 increments `repetitions`; interval is 1 day (rep 1), 6 days (rep 2),
  or `round(prev_interval × ease_factor)` (rep 3+).
  `ease_factor' = max(1.3, ease_factor + (0.1 − (5−quality) × (0.08 + (5−quality) × 0.02)))`.
  `due_date = toLocalISODate(today + interval days)`.
- `src/lib/subjects.ts` — the O/L and A/L-stream subject lists currently
  hardcoded inline in `public/legacy/chat.html`, extracted into one shared
  constant. Needed here for the AI-generate subject picker, and available
  for whenever `ChatPage` is ported off the legacy page.

**Styling** — new `src/styles/flashcards.css`, added to `main.tsx`'s import
list, following the established one-stylesheet-per-feature pattern.

## Data model

New Supabase tables, RLS scoped to the owning student (same pattern as every
other table in this app):

```sql
create table flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

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
```
RLS: both tables restrict `select/insert/update/delete` to rows where
`flashcard_decks.user_id = auth.uid()` (cards via a join through `deck_id`),
identical shape to `student_profiles`/`study_tasks` policies already in place.

New backend-owned table (service-role write only, no client access — this is
the shared quota counter, and a student must not be able to write it directly):
```sql
create table gemini_daily_usage (
  usage_date date not null,
  feature text not null,       -- 'chat' | 'flashcards' | 'ingestion'
  request_count int not null default 0,
  daily_limit int not null,
  primary key (usage_date, feature)
);
```

Frontend types, `src/types/flashcard.ts`:
```ts
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

## Backend hand-off: `POST /flashcards/generate`

Not implemented in this repo. Contract for whoever builds it:

**Request** — must include an `Authorization: Bearer <access_token>` header (the
student's Supabase session token); the backend should verify the JWT and derive
`student_id` from it rather than trusting the body value, which is a shared
endpoint against a scarce daily quota. The body keeps `student_id` for
convenience/logging only:
```json
{
  "student_id": "uuid",
  "subject": "Chemistry",
  "level": "<from profile.exam_type>",
  "stream": "<'OL' for O/L students, else profile.stream>",
  "syllabus": "<from profile.syllabus>",
  "medium": "<from profile.medium>",
  "count": 10
}
```
**Response — success:**
```json
{ "cards": [ { "front": "...", "back": "..." }, ... ] }
```
**Response — no usable content** (RagService returned nothing above the
existing 0.3 relevance threshold for this subject):
```json
{ "cards": [], "reason": "no_content" }
```
**Response — quota exhausted** (HTTP 429):
```json
{ "error": "quota_exhausted", "message": "AI flashcards are at today's limit — try again tomorrow." }
```

**Server-side flow:** call `RagService.Search` via `RAG_GRPC_CLIENT` with the
subject/level/syllabus/medium filters (topK large enough to give Gemini good
coverage, e.g. 20–30 chunks) → atomically check-and-increment
`gemini_daily_usage` for `feature='flashcards'` before calling Gemini (single
UPSERT, race-safe under concurrent requests):
```sql
insert into gemini_daily_usage (usage_date, feature, request_count, daily_limit)
values (current_date, 'flashcards', 1, 5)
on conflict (usage_date, feature) do update
  set request_count = gemini_daily_usage.request_count + 1
  where gemini_daily_usage.request_count < gemini_daily_usage.daily_limit
returning request_count;
```
No row returned → quota exhausted, return 429 **without** calling Gemini. Row
returned → proceed with **one** Gemini call asking for all `count` cards in a
single prompt (not one call per card — this is the whole point of the reserved
slice being viable at all against a 20/day account ceiling).

**Open item for the implementer:** the exact string values `papers.level` uses
(e.g. whether O/L is stored as `"OL"` or `"O/L"`) weren't confirmed — match
against real data before wiring the filter. This is about `level`'s own value
format only; `stream` is now sent as its own field in the request (computed the
same way as `chat.html`'s `streamValue`: `'OL'` for O/L students, otherwise
`profile.stream`), so the two should not be conflated when filtering.

The frontend never shows a per-student "N generations left" counter, since the
pool is shared across all students, not personal — only an available/unavailable
state, surfaced as the modal's error text on a 429.

## Data flow

**Deck list / create** — `supabase.from('flashcard_decks').select('*, flashcards(count)').eq('user_id', ...)`
for the list with card counts; insert with `{ user_id, title }` for create.

**Manual card add** — `supabase.from('flashcards').insert({ deck_id, front, back, source: 'manual' })`
(interval/repetitions/ease_factor/due_date all take their column defaults, so a
new card is immediately due).

**AI generate** — `AiGenerateModal` posts to the backend endpoint above, holds
the returned `cards` array in local component state only (nothing written to
Supabase yet). Each staged card can be edited in place or removed from the
array. "Save N cards" does one batched
`supabase.from('flashcards').insert(acceptedCards.map(c => ({ deck_id, front: c.front, back: c.back, source: 'ai' })))`,
then closes the modal and refreshes the deck's card list. A page refresh mid-review
loses unsaved staged cards — acceptable, since generation is a single short sitting,
not something worth the complexity of persisting server-side.

**Study session** — on mount, one query for the whole due queue:
```
supabase.from('flashcards')
  .select('id, deck_id, front, back, interval, repetitions, ease_factor, due_date, flashcard_decks!inner(user_id)')
  .eq('flashcard_decks.user_id', session.user.id)
  .lte('due_date', toLocalISODate(new Date()))
  .order('due_date', { ascending: true })
```
Held in local state, one card shown at a time. On grading: `computeNextReview(quality, card)`
→ `supabase.from('flashcards').update({ interval, repetitions, ease_factor, due_date, last_reviewed_at: new Date().toISOString() }).eq('id', card.id)`
→ advance to the next card in the local queue (no re-fetch needed until the
session ends). Session summary at the end shows cards reviewed / breakdown by
grade.

## Error handling

- Deck/card list fails to load, toggle/delete fails: same inline
  "Couldn't load ... right now." / silent-log pattern as Planner and
  `TasksPanel`.
- AI generate request fails outright (network/5xx): inline error text in the
  modal, matching the chat-bubble error pattern from `chat.html`.
- `reason: "no_content"`: "Not enough past-paper material for this subject yet."
- 429 quota exhausted: "AI flashcards are at today's limit — try again
  tomorrow." No retry loop, no polling.
- Study session with zero due cards: empty state, no crash — "Study now" is
  disabled/hidden from `FlashcardsPage` in this case rather than letting the
  student land on an empty session.

## Testing

No automated test framework in this repo (confirmed convention). `computeNextReview`
is pure and cheap to sanity-check against known SM-2 outputs (e.g. a card
answered Good three times in a row should land on 1 → 6 → 6×2.5=15 day
intervals) before wiring it into the UI. Beyond that, manual `npm run dev`
walkthrough per usual: create a deck, add a card manually, generate via AI
(against a subject with real ingested papers) and verify staging/accept/edit/
discard all work, grade a card through all four buttons and confirm the interval
math and `due_date` match the formula, and confirm "Study now" pulls cards from
multiple decks into one queue. Note that classic SM-2 has no same-day
relearning step: grading Again sets `interval` to 1 day like a first-time Good
does, so the card becomes due *tomorrow*, not later in the same session — worth
confirming this is the expected behavior (not a bug) during manual testing, and
worth double-checking `due_date` lands on the correct local calendar day given
this app's history of UTC-boundary bugs — `toLocalISODate` must be used for the
date math, never `.toISOString()`.
