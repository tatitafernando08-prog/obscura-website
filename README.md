# Obscura

Obscura is an AI-powered study companion: a marketing site plus an authenticated app (AI chat, planner, focus room, progress tracking) backed by Supabase.

The site is being converted from static HTML/CSS/JS to a React SPA. **Phase 1** (this codebase) covers the marketing pages, auth/onboarding, and the app shell/routing; the authenticated feature pages (Dashboard, Chat, Planner, Focus Room) are still on their original static implementation — see [Legacy pages](#legacy-pages) below.

## Tech stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/) (data router, with `lazy()` route loading)
- [Vite](https://vite.dev/) + TypeScript (strict mode)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`) for auth and data
- [`@google/model-viewer`](https://modelviewer.dev/) for the 3D robot model on the homepage
- [oxlint](https://oxc.rs/) for linting

## Running locally

```bash
npm install
cp .env.example .env   # then fill in your Supabase project's URL/anon key
npm run dev
```

The dev server prints a local URL (Vite's default is `http://localhost:5173`).

Other scripts:

```bash
npm run build     # type-check (tsc -b) then production build to dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values — Vite only exposes vars prefixed `VITE_`:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `VITE_BACKEND_URL` | Base URL of the `obscura-backend` API (used by the chat client) |

## Project structure

```
index.html          Vite entry HTML (mounts src/main.tsx)
vite.config.ts       Vite config
vercel.json           SPA rewrite (all routes -> index.html)

src/
  main.tsx            App entry point
  router.tsx           Route table (react-router-dom data router)
  style.css            Global styles, carried over from the static site
  types/                 Shared TS types (profile, chat, model-viewer ambient decl)
  data/                 Static content (journey milestones)
  lib/
    supabaseClient.ts     Supabase client instance
    api/chat.ts            Typed client for the chat backend
  context/
    AuthContext.tsx        Session/profile auth context
  hooks/                 useReveal (scroll-in animation), useScrollToHash
  components/
    layout/                Nav, Footer
    modals/                Signup/login, newsletter
    marketing/              Homepage sections (Hero, About, Features, Plans, ...)
    journey/                Timeline components for /journey
    app-shell/               Sidebar for the authenticated app shell
    routing/                ProtectedRoute (guards session/profile routes)
    common/                 ErrorBoundary
  layouts/
    MarketingLayout.tsx      Wraps the public marketing pages (Nav/Footer/modals)
    AppLayout.tsx             Wraps the authenticated /app/* shell (Sidebar)
  pages/
    HomePage.tsx, JourneyPage.tsx, OnboardingPage.tsx
    app/                     Dashboard/Chat/Planner/FocusRoom/Progress — currently
                              placeholders, see below

public/
  assets/               Images, video, and the 3D model, served as-is
  legacy/               Old static pages, see below

docs/superpowers/       Design docs and the implementation plan for this conversion
```

## Legacy pages

`/app/dashboard`, `/app/chat`, `/app/planner`, and `/app/focus-room` are currently **placeholder** React pages — each just links out to the original, fully working static page, which was moved unchanged (aside from fixing asset paths) to `public/legacy/`:

- `/legacy/dashboard.html`
- `/legacy/chat.html`
- `/legacy/planner.html`
- `/legacy/focus-room.html`
- `/legacy/progress.html`

These stay live and fully functional while the React versions of those pages are built out in a later phase. Don't edit the React placeholders expecting feature parity yet — the real behavior still lives in the `/legacy` HTML/CSS/JS.

The marketing pages (`/`, `/journey`) and onboarding flow are already fully converted to React and have no legacy equivalent.
