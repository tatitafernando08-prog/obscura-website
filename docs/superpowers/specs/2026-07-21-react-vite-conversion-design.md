# Obscura Website — React + Vite Conversion (Phase 1: Marketing + Auth Shell)

**Date:** 2026-07-21
**Status:** Approved, ready for implementation plan

## Context

The Obscura site is currently plain HTML/CSS/JS: a marketing site (`index.html`, `journey.html`) plus a working Supabase-backed product (`onboarding.html`, `dashboard.html`, `chat.html`, `planner.html`, `focus-room.html`) with auth, a study planner, a Pomodoro focus room, and an AI chat page. The chat page already calls a backend at `/chat/ask` with a shape that closely matches the documented NestJS contract:

```
POST /chat/ask
Request:  { question, stream, subject, syllabus, medium, student_id, chat_history[] }
Response: { answer, sources: [{ past_papers: { subject, year } }] }
```

Supabase URL/anon key are currently hardcoded and duplicated in `script.js` and every app page's inline `<script>`. Each app page also duplicates the sidebar shell markup and an auth-guard (`if (!localStorage.getItem('obscura_session')) redirect`).

## Scope

This phase converts the **marketing site + auth/onboarding + the authenticated app shell** to React. It does **not** implement the real Dashboard, Chat, Planner, or Focus Room pages — those become placeholder routes for a later phase. This keeps the phase focused: routing, layout, auth, and the existing landing/journey content, without also re-implementing Supabase task CRUD, the Pomodoro/focus-room logic, or the live chat integration.

## Decisions

- **TypeScript**, Vite, React Router v6 (data router).
- **`@supabase/supabase-js`** replaces raw `fetch()` calls to Supabase's REST/Auth endpoints.
- **`style.css` stays global**, imported once — not split into CSS Modules in this phase.
- **Single SPA with route-level code splitting**: the app-shell route group (`/onboarding`, `/app/*`) is lazy-loaded via `react-router-dom`'s `lazy()` so marketing visitors don't download Supabase/app-shell code.
- Assets move to `public/assets/` unchanged (absolute paths like `/assets/logo.png` keep working, important for the ~20 images referenced in the journey timeline).

## Architecture

Three route/layout groups under one `createBrowserRouter` tree:

1. **`MarketingLayout`** (`Nav` + `Footer` + `SignupLoginModal` + `NewsletterModal`) wraps `/` (Home) and `/journey`.
2. **`OnboardingPage`** — standalone, no nav/footer. Protected: requires a session.
3. **`AppLayout`** (lazy-loaded, sidebar shell) wraps `/app/dashboard`, `/app/chat`, `/app/planner`, `/app/focus-room`. Protected: requires a session **and** an onboarding profile.

`.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND_URL` (for the future `/chat/ask` client).

## Component breakdown

**`components/layout/`**: `Nav` (desktop links + mobile hamburger, local state), `Footer` (static).

**`components/marketing/`**: `Hero`, `About`, `Features` + `FeatureCard`, `Plans` + `PlanCard` + `ComparisonTable`, `NeshSection` (static phone-mockup preview), `PomodoroTryout` (landing page's stateful "try it free" generator), `RobotSection` (wraps `<model-viewer>` from the `@google/model-viewer` npm package), `SnacksSection`, `Testimonials` (carousel via `useRef` + `scrollBy`), `Contact`.

**`components/journey/`**: `TimelineItem` (owns its own image-gallery carousel state per milestone), `TimelineProgressLine` (scroll-linked fill, `useRef` + scroll listener).

**`components/modals/`**: `SignupLoginModal` (signup/login/success states, opened via `AuthContext`), `NewsletterModal` (same 4s-delay popup behavior).

**`components/common/`**: `Reveal` (wraps the current `.reveal` + `IntersectionObserver` pattern declaratively).

**`components/app-shell/`**: `Sidebar` (used by `AppLayout`, `NavLink` for active state).

**Pages**: `HomePage`, `JourneyPage`, `OnboardingPage`, and placeholders `DashboardPage`, `ChatPage`, `PlannerPage`, `FocusRoomPage` (render inside `AppLayout` with "Coming in the next phase" content).

## Data flow & auth

- **`lib/supabaseClient.ts`** — single `createClient()` instance from env vars.
- **`context/AuthContext.tsx`** — wraps the app above the router. Uses `supabase.auth.onAuthStateChange` + `getSession()`. Exposes `session`, `profile` (the `student_profiles` row), `signUp()`, `signIn()`, `signOut()`, `openSignupModal()`, `openLoginModal()`.
- **`ProtectedRoute`** — redirects to `/` if no session, to `/onboarding` if session but no profile, else renders the outlet. Replaces the per-page `if (!sessionRaw) window.location.href = ...` guards.
- Onboarding writes use `supabase.from('student_profiles').insert(...)` instead of raw REST fetch.
- **`types/chat.ts`** — typed to the documented contract (`ChatRequest`, `ChatResponse`).
- **`lib/api/chat.ts`** — typed `askNesh(req: ChatRequest): Promise<ChatResponse>` hitting `POST {VITE_BACKEND_URL}/chat/ask`. Not wired into a page yet (Chat page is deferred to phase 2), but ready for it.

## Error handling

- Form errors (signup/login/newsletter/onboarding) keep today's pattern: inline error state in the modal/card, not toasts. `AuthContext` methods throw typed errors; callers decide how to display them.
- A top-level React `ErrorBoundary` around the router (new — not present today, cheap safety net).
- **Explicitly out of scope this phase**: real Dashboard/Chat/Planner/Focus Room implementations, their Supabase task-loading, Pomodoro/theme/quotes/Spotify logic in Focus Room, and the live `/chat/ask` integration.

## Testing

No new test infrastructure introduced (none exists today, not requested). Verification is manual via `npm run dev`, matching how the current site is checked today.
