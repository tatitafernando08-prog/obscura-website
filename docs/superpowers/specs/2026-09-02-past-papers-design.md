# Past Papers Browser — Design

Date: 2026-09-02
Status: Approved

## Problem

`/app/papers` doesn't exist yet — Past Papers was never ported from legacy (there
is no `legacy/*.html` for it either; this is a genuinely new page, not a port).
The backend's ingestion pipeline (`obscura-backend-v2`, sibling repo) has been
live since Phase 3 and exposes read endpoints for the papers it has ingested.

Confirmed against the backend's actual source, not assumed:

- `PapersController` (`libs/gateway/src/papers/papers.controller.ts`), gated by
  `AuthGuard` (any authenticated student, no admin requirement), no throttle.
- `GET /papers` → `{ papers: [{paper_id, subject, year, syllabus, level,
  medium, status}] }`, ordered by `created_at desc`, hard-capped at 100 rows.
  No query params — no server-side filter, search, or pagination.
- `GET /papers/:id` → `{paper_id, subject, year, status, chunk_count}` — a
  **narrower** shape than the list row (drops `syllabus`/`level`/`medium`,
  adds `chunk_count`). 404 (`paper_not_found`) for a bogus id.
- `status` can be `'processing'` or `'ready'` (ingestion is async — upload,
  chunk, embed, then flip to ready). A `'processing'` paper has no usable
  content yet.
- **No view/download capability exists anywhere in the backend.** The
  `papers` table has a `storage_path`, but no route ever returns it or a
  signed URL, and the Supabase Storage bucket (`papers`) is explicitly
  private (`Public: off`, per the backend's own implementation plan).
  `StorageService` only exposes server-side `uploadPdf`/`downloadPdf`/
  `deletePdf` — nothing client-facing. Confirmed with the user: out of scope
  for this pass; revisit once the backend adds a download/signed-URL route.
- The backend's own plan documents `GET /papers`/`GET /papers/:id` as a
  polling-fallback stub for ingestion status, "not wired client-side... for
  `PastPapersScreen`'s eventual real backend" — this page is that eventual
  client work.

## Scope

**In scope:**
- A list page (`/app/papers`) showing ingested papers as a card grid:
  subject, year, syllabus.
- Client-side subject/year/syllabus filters, derived from the loaded set.
- A detail page (`/app/papers/:id`) showing subject, year, status,
  chunk_count, with a back link.
- New Sidebar nav item, "Past Papers".

**Out of scope (explicit, confirmed with user):**
- View/download of the actual PDF — no backend route exists to serve it.
- Quick Search — no `/search` endpoint exists anywhere in the backend
  (confirmed absent on `master` and all local branches); `SPEC-SHEET.md`
  explicitly lists it as a non-goal for the backend's current spec, not
  built. Separate feature, separate spec, once a real endpoint exists.
- Server-side search/filter/pagination — the backend doesn't support it;
  100 rows is the realistic ceiling for now.

## Architecture

**Types** (`src/types/paper.ts`, new):
```ts
export type PaperStatus = 'processing' | 'ready' | 'failed'; // DB check constraint

export interface PastPaper {
  paper_id: string;
  subject: string;
  year: number | null;
  syllabus: string;
  level: string;
  medium: string;
  status: PaperStatus;
}

export interface PastPaperDetail {
  paper_id: string;
  subject: string;
  year: number | null;
  status: PaperStatus;
  chunk_count: string; // count(*) is Postgres bigint; `pg` returns bigint as
                        // a JS string by default (no custom type parser is
                        // registered in DatabaseService) — not a number.
}
```

**API client** (`src/lib/api/papers.ts`, new): `fetchPapers(accessToken):
Promise<PastPaper[]>` (`GET /papers`, unwraps `.papers`) and
`fetchPaper(id, accessToken): Promise<PastPaperDetail>` (`GET /papers/:id`).
Both send `Authorization: Bearer ${accessToken}`, reading `VITE_BACKEND_URL`
the same way `src/lib/api/chat.ts` does. `fetchPaper` surfaces a distinct
"not found" case for a 404 response; both distinguish 401 from other
failures, mirroring `askNesh`'s status-based error handling.

**Pages:**
- `src/pages/app/PastPapersPage.tsx` (list, replace nothing — new route):
  fetch on mount, keep only `status === 'ready'` rows, derive subject/year/
  syllabus filter option lists from that filtered set (`'All'` default per
  filter), render as a card grid following Flashcards' `deck-grid`/
  `deck-card` pattern (`src/styles/flashcards.css`) since there's no legacy
  page to port here. Distinct empty states: no papers ingested yet, vs. no
  papers match the current filters.
- `src/pages/app/PastPaperDetailPage.tsx` (detail, new route): fetch by id,
  render subject/year/status/chunk_count, back link to `/app/papers`. 404 →
  "Paper not found" with the same back link, not a crash.

**Nav** (`src/components/app-shell/Sidebar.tsx`, edit): new `NAV_ITEMS` entry,
`{ to: '/app/papers', label: 'Past Papers', path: <book/document icon> }`,
positioned between AI Chat and Planner.

**Routing** (`src/router.tsx`, edit): two new lazy routes nested inside
`AppLayout`'s children, `path: 'papers'` and `path: 'papers/:id'`, alongside
the existing `chat`/`planner`/`flashcards` entries.

**Styling** (`src/styles/papers.css`, new, added to `main.tsx`'s stylesheet
import list): card-grid list layout and detail-page layout, following the
existing card look (`#ffffff` background, `rgba(124,92,191,0.1)` border,
`16px` radius) already used by Flashcards/Dashboard rather than inventing a
new visual language.

## Data flow

1. **List mount:** guard on `session`; call `fetchPapers(session.access_token)`.
   On success, filter to `status === 'ready'`, then derive `{subjects, years,
   syllabuses}` option lists from that filtered array (deduped, sorted).
   On error: `console.error` the raw error, show a load-error message.
2. **Filtering:** three local `'All' | string` selects (subject, year,
   syllabus), applied client-side against the already-loaded, already-ready-
   filtered array — no re-fetch on filter change.
3. **Card click:** `<Link to={`/app/papers/${paper.paper_id}`}>` — plain
   client-side nav, no state handoff relied upon (detail page re-fetches
   independently so direct navigation/refresh both work correctly).
4. **Detail mount:** guard on `session` and `id` param; call
   `fetchPaper(id, session.access_token)`. 404 → "Paper not found" state.
   Other errors → `console.error` + generic load-error message.

## Error handling

- **401** (either endpoint): "Your session expired — please sign in again."
  — same convention as Chat's `askNesh`.
- **404** (`fetchPaper` only): distinct "Paper not found" state on the
  detail page, not folded into the generic error message.
- **Network failure / other non-2xx:** generic "Couldn't load past papers" /
  "Couldn't load this paper" message; `console.error` the underlying error
  in every branch, no silent failures — matching Chat/Flashcards convention.

## Testing

Same convention as every other feature in this repo: no automated test
framework, so `npm run build` and `npm run lint` must both exit 0. Beyond
that, a manual `npm run dev` walkthrough (the project owner, since
authenticating a session isn't something Claude does): confirm the list
loads and shows only `ready` papers; confirm each filter narrows the grid
correctly and "All" resets it; confirm a card click navigates to its detail
page and shows the right subject/year/status/chunk_count; confirm a direct
visit to `/app/papers/:id` (not via click-through) still works; confirm a
bogus id shows "Paper not found" rather than crashing; confirm the 401 path
(expired/invalid session) shows its distinct message.
