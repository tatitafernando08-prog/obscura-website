# AI Chat — Design

Date: 2026-08-29
Status: Approved

## Problem

`/app/chat` is still a placeholder pointing students at `/legacy/chat.html`.
The backend team has now fully deployed `obscura-api` (NestJS, Railway) with a
working `POST /chat/ask` endpoint, so this is the last of the original legacy
pages (Dashboard, Focus Room, Planner, Progress, Flashcards already ported) to
replace with a real React implementation.

Confirmed against the backend's actual source (`obscura-backend-v2`, sibling
repo), not guessed:

- `ChatController` (`libs/gateway/src/chat/chat.controller.ts`), route
  `POST /chat/ask`, guarded by `AuthGuard` — **requires** an
  `Authorization: Bearer <token>` header verified against Supabase via a gRPC
  auth service. The existing (never-shipped) `src/lib/api/chat.ts` stub sends
  no auth header at all — this is the same class of bug the Flashcards
  final-review pass already found and fixed for `AiGenerateModal`.
- Request DTO (`ChatAskDto`): `question` and `medium` are required strings;
  `stream`, `subject`, `syllabus`, `chat_history` are all optional. The
  existing `src/types/chat.ts` marks `stream`/`subject`/`syllabus` as
  required — needs correcting to match the real contract.
- **`stream` is validated but never forwarded anywhere server-side** —
  `ChatController.ask()` reads only `question`/`subject`/`syllabus`/`medium`/
  `chat_history` off the body when calling `GatewayAskService`. Sending it
  costs nothing (harmless per the mobile app's existing wire contract) but it
  currently has zero effect on the answer.
- Response shape: `{ answer: string, sources: [{ past_papers: { subject,
  year } }] }` — confirmed via `ChatController.ask()`'s return statement and
  the backend's own e2e spec. This already matches the existing (previously
  speculative) `ChatResponse` type exactly, no change needed there.
- **No endpoint exists to fetch prior chat history.** The backend persists
  messages server-side via `ChatSessionsRepository` for its own bookkeeping,
  but nothing reads it back. Conversation state is therefore necessarily
  client-side and ephemeral (lost on refresh/nav-away) — this is a hard
  constraint from the contract, not a UX preference.
- Rate limit: `@Throttle({ limit: 20, ttl: 60_000 })` — 20 requests/minute per
  caller. Worth a distinct, friendly error message rather than a generic one.
- `Chat` is already routed inside `AppLayout` (`src/router.tsx`, sidebar
  visible), unlike Focus Room's full-screen route — so the message list needs
  its own bounded-height scroll region inside `.app-main`, not a page-level
  scroll.

## Scope

**In scope:**
- Replace the `ChatPage.tsx` placeholder with a real chat UI: subject
  dropdown, scrollable message transcript, bottom input row.
- Wire it to the real `POST /chat/ask` contract above, including the missing
  auth header.
- Show the AI's answer per turn, and — when `sources` is non-empty — a
  citation (subject + year) attached to that answer.
- Status-aware error handling: auth (401), rate limit (429), generic/network.

**Out of scope (v1, explicit):**
- Persisting/restoring chat history across page reloads — impossible without
  a backend history-fetch endpoint that doesn't exist; not this repo's call
  to add speculatively.
- Multiple concurrent conversations / conversation switching — one running
  transcript per page visit, matching the backend's one-session-per-student
  model.
- Streaming/typing-effect responses — the backend returns one synchronous
  JSON response, not SSE; no streaming to build against.
- Voice input/output — `libs/gateway/src/voice` exists backend-side but is a
  separate, unrelated feature not requested here.

## Architecture

**Types** (`src/types/chat.ts`, edit not rewrite):
```ts
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  question: string;
  medium: string;
  student_id: string;
  stream?: string;
  subject?: string;
  syllabus?: string;
  chat_history?: ChatHistoryMessage[];
}

export interface ChatSource {
  past_papers: {
    subject: string;
    year: string;
  };
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}
```

**API client** (`src/lib/api/chat.ts`, edit): `askNesh(request, accessToken)`
adds `Authorization: Bearer ${accessToken}` to the existing fetch call, and
distinguishes error handling by HTTP status (see Error handling) instead of
one generic catch-all.

**Page** (`src/pages/app/ChatPage.tsx`, replace placeholder entirely):
- Subject dropdown, populated via `subjectsForProfile(profile)` (already
  built for Flashcards, `src/lib/subjects.ts` — reused as-is, no new subject
  logic).
- Scrollable `.chat-messages` region showing user/assistant bubbles in order.
- Bottom `.chat-input-row` (text input + send button), pinned below the
  scroll region — the container itself is bounded-height inside `.app-main`,
  not relying on page-level scroll.
- Empty state before the first message, matching the legacy page's "Ask NESH
  anything" prompt.

**Styling** (`src/styles/chat.css`, new — added to `main.tsx`'s stylesheet
import list, following the one-file-per-feature convention): bubble styles,
loading/error bubble variants, citation chip styling, bounded-height chat
container layout. Largely ports `chat.html`'s inline `<style>` block into a
real stylesheet, adjusted for living inside `.app-main` instead of a
full-page `.app-shell`.

No new Supabase tables, no RLS changes — this feature touches only the
backend's `/chat/ask` endpoint and holds all state in React component state.

## Data flow

1. On mount: `subjects = subjectsForProfile(profile)`, default selection =
   `subjects[0]`. `streamValue` computed once per profile, same rule as the
   legacy page: `'OL'` if `profile.exam_type === 'OL'`, else `profile.stream`.
2. **Send:** trim the input; if empty, no-op. Append a user bubble and a
   loading assistant bubble ("Thinking…") to local state immediately. Call
   `askNesh({ question, stream: streamValue, subject: selectedSubject,
   syllabus: profile.syllabus, medium: profile.medium, student_id:
   session.user.id, chat_history: history }, session.access_token)`, where
   `history` is the in-memory array of prior turns built so far this page
   visit (the backend itself only uses the last 6 turns —
   `.slice(-6)` in `ChatController.ask()` — so the frontend does not need to
   pre-trim before sending).
3. **On success:** replace the loading bubble's text with `answer`. If
   `sources.length > 0`, dedupe by `subject`+`year` (retrieval can return
   multiple chunks from the same past paper) and render as small citation
   chips under that bubble, e.g. "Physics · 2019". Append `{role:'user',
   content: question}` and `{role:'assistant', content: answer}` to the
   in-memory history for subsequent turns.
4. **On error:** replace the loading bubble with an error-styled bubble (see
   Error handling for message text), `console.error` the raw error, and
   leave the transcript otherwise intact so the student can retry.
5. Changing the subject dropdown mid-conversation does not clear the
   transcript — it only changes what's sent as `subject` on the *next*
   question, matching the legacy page's behavior.
6. Reloading the page starts a fresh, empty transcript — expected, not a bug
   (see Scope: no history-fetch endpoint exists).

## Error handling

- **401** (`missing_bearer_token` / `invalid_or_expired_token` / other auth
  failure): "Your session expired — please sign in again."
- **429** (throttle limit hit): "You're sending messages too fast — wait a
  moment and try again."
- **Network failure / non-2xx other status**: "NESH couldn't answer that
  just now." — using the backend's own `message` field when the response
  body has one, falling back to this generic text otherwise (mirrors the
  existing `askNesh()` fallback logic, just no longer the *only* branch).
- All branches: `console.error` the underlying error for debugging, matching
  the Flashcards convention — no silent failures.
- Empty `sources` array on an otherwise-successful response is not an error
  state — just render the answer with no citation chips.

## Testing

No automated test framework in this repo (confirmed convention) —
`npm run build` and `npm run lint` must both exit 0. Beyond that, a manual
`npm run dev` walkthrough (done by the project owner, since authenticating a
session is not something Claude does): send a question with a subject that
has ingested past-paper content and confirm the answer renders with citation
chips; send one for a subject with no ingested content and confirm a graceful
answer (or empty `sources`) rather than a crash; confirm switching subjects
mid-conversation doesn't wipe the transcript; confirm the 401 and 429 paths
produce their distinct messages (429 can be triggered by sending >20
messages in a minute); confirm the chat container scrolls independently of
the sidebar/page and the input stays pinned at the bottom as the transcript
grows.
