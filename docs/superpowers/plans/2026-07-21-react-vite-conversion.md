# React + Vite Conversion (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Obscura marketing site (`index.html`, `journey.html`), auth/onboarding flow, and authenticated app shell to a Vite + React + TypeScript SPA, matching the design in `docs/superpowers/specs/2026-07-21-react-vite-conversion-design.md`.

**Architecture:** Single Vite React Router (data router) app. `MarketingLayout` (Nav/Footer/modals) wraps `/` and `/journey`. `ProtectedRoute` guards `/onboarding` (needs session) and `/app/*` (needs session + profile). `AppLayout` and everything under `/app/*` and `/onboarding` is lazy-loaded via `react-router-dom`'s route `lazy()`. Dashboard/Chat/Planner/Focus Room get placeholder pages this phase, linking to the untouched originals moved to `/legacy/*.html`.

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom v6 (data router + `lazy`), @supabase/supabase-js, @google/model-viewer.

## Global Constraints

- TypeScript strict mode (Vite `react-ts` template default). Avoid `any`.
- Preserve the existing visual design and copy exactly — this is a framework conversion, not a redesign.
- `style.css` content is not modified this phase, only relocated to `src/style.css` and imported once in `main.tsx`.
- No automated test framework is introduced this phase. Verify each task with `npm run build` (type-checks + bundles; must exit 0) and, where noted, a manual `npm run dev` check in the browser.
- Supabase URL/anon key and the backend URL are read only from `import.meta.env.VITE_*` — never hardcoded in source.
- `chat.html`, `dashboard.html`, `planner.html`, `focus-room.html` move to `public/legacy/*.html` unchanged in behavior (only path references fixed) and stay reachable. Their React replacements this phase (`/app/*`) are placeholders that link to the `/legacy` originals.
- `index.html` and `journey.html` are fully converted this phase — no legacy copies needed for those two.
- All new source files use the directory layout below; don't invent alternate locations.

```
src/
  main.tsx
  router.tsx
  style.css
  vite-env.d.ts
  types/
    model-viewer.d.ts
    profile.ts
    chat.ts
  data/
    journeyMilestones.ts
  lib/
    supabaseClient.ts
    api/
      chat.ts
  context/
    AuthContext.tsx
  hooks/
    useReveal.ts
    useScrollToHash.ts
  components/
    layout/       (Nav.tsx, Footer.tsx)
    modals/        (SignupLoginModal.tsx, NewsletterModal.tsx)
    marketing/     (Hero.tsx, About.tsx, Features.tsx, Plans.tsx, NeshSection.tsx,
                     PomodoroTryout.tsx, RobotSection.tsx, SnacksSection.tsx,
                     Testimonials.tsx, Contact.tsx)
    journey/       (TimelineItem.tsx, TimelineProgressLine.tsx)
    app-shell/     (Sidebar.tsx)
    routing/       (ProtectedRoute.tsx)
    common/        (ErrorBoundary.tsx)
  layouts/
    MarketingLayout.tsx
    AppLayout.tsx
  pages/
    HomePage.tsx
    JourneyPage.tsx
    OnboardingPage.tsx
    app/
      DashboardPage.tsx
      ChatPage.tsx
      PlannerPage.tsx
      FocusRoomPage.tsx
public/
  assets/          (moved from repo-root assets/, unchanged structure)
  legacy/
    chat.html
    dashboard.html
    planner.html
    focus-room.html
    style.css       (frozen copy for the legacy pages)
```

---

## Task 1: Scaffold the Vite + React + TypeScript project

**Files:**
- Create (via scaffold, then copied to repo root): `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `.gitignore`
- Delete after copy: scaffold's `src/App.tsx`, `src/App.css`, `src/assets/react.svg`, `public/vite.svg` (not needed)

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` toolchain that every later task builds on.

- [ ] **Step 1: Scaffold into a throwaway sibling directory**

```bash
npm create vite@latest scaffold-tmp -- --template react-ts
```

Expected: creates `scaffold-tmp/` with the standard Vite React-TS template, no prompts (template + name both supplied).

- [ ] **Step 2: Copy the generated project files into the repo root**

```bash
cp scaffold-tmp/package.json scaffold-tmp/tsconfig.json scaffold-tmp/tsconfig.app.json scaffold-tmp/tsconfig.node.json scaffold-tmp/vite.config.ts .
cp scaffold-tmp/src/main.tsx scaffold-tmp/src/vite-env.d.ts src/ 2>/dev/null || mkdir -p src && cp scaffold-tmp/src/main.tsx scaffold-tmp/src/vite-env.d.ts src/
cp scaffold-tmp/index.html .
cat scaffold-tmp/.gitignore >> .gitignore
```

Note: `tsconfig.app.json`/`tsconfig.node.json` only exist on newer Vite versions — if `npm create vite@latest` only produced a single `tsconfig.json`, copy just that one and skip the missing files.

- [ ] **Step 3: Remove the scaffold's placeholder app code and temp directory**

```bash
rm -f src/App.tsx src/App.css
rm -rf src/assets scaffold-tmp
```

- [ ] **Step 4: Install dependencies at the repo root**

```bash
npm install
```

Expected: exits 0, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 5: Rewrite `index.html` as the SPA entry, preserving the original `<title>` and fonts**

Replace the generated `index.html` content with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Obscura — Your AI-powered study companion</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write a placeholder `src/main.tsx` so the build succeeds before later tasks flesh it out**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>Obscura — scaffold OK</div>
  </StrictMode>
);
```

- [ ] **Step 7: Verify the build**

```bash
npm run build
```

Expected: exits 0, prints a `dist/` output summary with no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts index.html src/main.tsx src/vite-env.d.ts .gitignore
git commit -m "Scaffold Vite + React + TypeScript project"
```

---

## Task 2: Move global assets and stylesheet into the new structure

**Files:**
- Move: `assets/` → `public/assets/`
- Move: `style.css` → `src/style.css`
- Create: `public/legacy/style.css` (frozen copy for the deferred static pages)
- Modify: `src/main.tsx` (import the stylesheet)

**Interfaces:**
- Produces: `/assets/*` served as static files at the same relative paths every component will reference; `src/style.css` imported once globally.

- [ ] **Step 1: Move assets and style.css with git mv (preserves history)**

```bash
mkdir -p public
git mv assets public/assets
git mv style.css src/style.css
```

- [ ] **Step 2: Create the frozen copy for legacy pages**

```bash
mkdir -p public/legacy
cp src/style.css public/legacy/style.css
git add public/legacy/style.css
```

- [ ] **Step 3: Import the stylesheet in `main.tsx`**

Add to the top of `src/main.tsx`:

```tsx
import './style.css';
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: exits 0. Spot-check `dist/assets` (Vite's own build output dir, separate from `public/assets`) doesn't error on missing files.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Move assets and global stylesheet into src/public structure"
```

---

## Task 3: Move deferred app pages to /legacy and fix internal links

**Files:**
- Move: `chat.html` → `public/legacy/chat.html`
- Move: `dashboard.html` → `public/legacy/dashboard.html`
- Move: `planner.html` → `public/legacy/planner.html`
- Move: `focus-room.html` → `public/legacy/focus-room.html`
- Delete (superseded, no legacy copy needed): `journey.html`, `onboarding.html`, `index.html`'s old content, root `script.js` (removed at the end of this task since none of the moved legacy pages reference it — only the old `index.html`/`journey.html` did, and both are being replaced by React)

**Interfaces:**
- Produces: four standalone, still-fully-functional legacy pages served at `/legacy/*.html`, referencing `/assets/*` and `/legacy/style.css` with absolute paths, and redirecting to the new React routes (`/`, `/onboarding`) instead of the old static files.

- [ ] **Step 1: Move the four files**

```bash
git mv chat.html public/legacy/chat.html
git mv dashboard.html public/legacy/dashboard.html
git mv planner.html public/legacy/planner.html
git mv focus-room.html public/legacy/focus-room.html
```

- [ ] **Step 2: Fix `public/legacy/chat.html`**

Apply these exact replacements (use the Edit tool with `replace_all` where noted):

| old | new | replace_all |
|---|---|---|
| `href="style.css"` | `href="/legacy/style.css"` | no |
| `href="dashboard.html"` | `href="/legacy/dashboard.html"` | yes |
| `href="focus-room.html"` | `href="/legacy/focus-room.html"` | no |
| `href="chat.html"` | `href="/legacy/chat.html"` | no |
| `href="planner.html"` | `href="/legacy/planner.html"` | no |
| `src="assets/logo.png"` | `src="/assets/logo.png"` | yes |
| `src="assets/mascot_wave.png"` | `src="/assets/mascot_wave.png"` | no |
| `window.location.href = 'index.html';` | `window.location.href = '/';` | yes |
| `window.location.href = 'onboarding.html';` | `window.location.href = '/onboarding';` | no |

- [ ] **Step 3: Fix `public/legacy/dashboard.html`**

| old | new | replace_all |
|---|---|---|
| `href="style.css"` | `href="/legacy/style.css"` | no |
| `src="assets/logo.png"` | `src="/assets/logo.png"` | no |
| `href="dashboard.html"` | `href="/legacy/dashboard.html"` | yes |
| `href="focus-room.html"` | `href="/legacy/focus-room.html"` | no |
| `href="chat.html"` | `href="/legacy/chat.html"` | no |
| `href="planner.html"` | `href="/legacy/planner.html"` | yes |
| `href="index.html#pomodoro"` | `href="/#pomodoro"` | no |
| `window.location.href = 'index.html';` | `window.location.href = '/';` | yes |

- [ ] **Step 4: Fix `public/legacy/planner.html`**

| old | new | replace_all |
|---|---|---|
| `href="style.css"` | `href="/legacy/style.css"` | no |
| `src="assets/logo.png"` | `src="/assets/logo.png"` | no |
| `href="dashboard.html"` | `href="/legacy/dashboard.html"` | no |
| `href="chat.html"` | `href="/legacy/chat.html"` | no |
| `href="planner.html"` | `href="/legacy/planner.html"` | no |
| `href="focus-room.html"` | `href="/legacy/focus-room.html"` | yes |
| `window.location.href = 'index.html';` | `window.location.href = '/';` | yes |

- [ ] **Step 5: Fix `public/legacy/focus-room.html`**

| old | new | replace_all |
|---|---|---|
| `href="style.css"` | `href="/legacy/style.css"` | no |
| `href="dashboard.html"` | `href="/legacy/dashboard.html"` | no |
| `window.location.href = 'index.html';` | `window.location.href = '/';` | no |

- [ ] **Step 6: Verify no stale references remain**

```bash
grep -n 'href="style.css"\|href="dashboard.html"\|href="chat.html"\|href="planner.html"\|href="focus-room.html"\|href="index.html"\|href="onboarding.html"\|src="assets/' public/legacy/*.html
```

Expected: no output (empty match).

- [ ] **Step 7: Delete the now-superseded root files**

```bash
git rm journey.html onboarding.html script.js
```

Note: `index.html` at the repo root was already overwritten by Task 1 Step 5 (it's now the Vite entry) — nothing further to delete there.

- [ ] **Step 8: Commit**

```bash
git add public/legacy
git commit -m "Move deferred app pages to /legacy and fix internal links"
```

---

## Task 4: Supabase client, env vars, and typed profile model

**Files:**
- Create: `src/lib/supabaseClient.ts`
- Create: `src/types/profile.ts`
- Create: `.env`, `.env.example`
- Modify: `src/vite-env.d.ts` (add `ImportMetaEnv` typing)
- Modify: `.gitignore` (ensure `.env` is ignored, keep `.env.example` tracked)

**Interfaces:**
- Produces: `supabase` (a configured `SupabaseClient`), `StudentProfile` type, both imported by every later Supabase-touching task.

- [ ] **Step 1: Install the Supabase SDK**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Add env var typing to `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 3: Create `.env.example` (tracked) and `.env` (local, gitignored)**

`.env.example`:

```
VITE_SUPABASE_URL=https://zsdsqyowcjifbktbolji.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_BACKEND_URL=https://obscura-backend-production-d7de.up.railway.app
```

`.env` (same values as the current hardcoded ones in the old `script.js`, so local dev keeps working):

```
VITE_SUPABASE_URL=https://zsdsqyowcjifbktbolji.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZHNxeW93Y2ppZmJrdGJvbGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzI2MzAsImV4cCI6MjA5NTk0ODYzMH0.k6FeqX_s7y4C662Do6ii9MkRSlkWMFzdF2Knvrwg3b8
VITE_BACKEND_URL=https://obscura-backend-production-d7de.up.railway.app
```

- [ ] **Step 4: Confirm `.env` is gitignored**

```bash
grep -q '^\.env$' .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 5: Create `src/lib/supabaseClient.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 6: Create `src/types/profile.ts`**

```ts
export interface StudentProfile {
  id: string;
  exam_type: 'OL' | 'AL';
  syllabus: 'local' | 'edexcel' | 'cambridge';
  stream: 'science' | 'commerce' | 'arts' | 'technology' | null;
  medium: 'english' | 'sinhala' | 'tamil';
}
```

- [ ] **Step 7: Verify**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add src/lib/supabaseClient.ts src/types/profile.ts src/vite-env.d.ts .env.example .gitignore package.json package-lock.json
git commit -m "Add Supabase client, env config, and StudentProfile type"
```

---

## Task 5: AuthContext (session, profile, auth actions, modal state)

**Files:**
- Create: `src/context/AuthContext.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabaseClient.ts`, `StudentProfile` from `src/types/profile.ts`.
- Produces: `AuthProvider` component and `useAuth()` hook returning `{ session, profile, profileLoading, authModalMode, openSignupModal(), openLoginModal(), closeAuthModal(), signUp(email, password): Promise<{ hasSession: boolean }>, signIn(email, password): Promise<void>, signOut(): Promise<void>, refreshProfile(): Promise<void> }`. Every later component that touches auth, the signup/login modal, or Supabase profile data imports `useAuth` from here.

- [ ] **Step 1: Create `src/context/AuthContext.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { StudentProfile } from '../types/profile';

interface AuthContextValue {
  session: Session | null;
  profile: StudentProfile | null;
  profileLoading: boolean;
  authModalMode: 'signup' | 'login' | null;
  openSignupModal: () => void;
  openLoginModal: () => void;
  closeAuthModal: () => void;
  signUp: (email: string, password: string) => Promise<{ hasSession: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SIGNUP_REDIRECT_URL = 'https://d2gtuofwzvtzpk.cloudfront.net/verified.html';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login' | null>(null);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', currentSession.user.id)
      .maybeSingle();
    if (error) {
      console.error('Could not load profile', error);
      setProfile(null);
    } else {
      setProfile(data as StudentProfile | null);
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: SIGNUP_REDIRECT_URL },
    });
    if (error) throw new Error(error.message);
    return { hasSession: Boolean(data.session) };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

  const value: AuthContextValue = {
    session,
    profile,
    profileLoading,
    authModalMode,
    openSignupModal: () => setAuthModalMode('signup'),
    openLoginModal: () => setAuthModalMode('login'),
    closeAuthModal: () => setAuthModalMode(null),
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Wire `AuthProvider` into `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <div>Obscura — auth wired</div>
    </AuthProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.tsx src/main.tsx
git commit -m "Add AuthContext with session, profile, and auth-modal state"
```

---

## Task 6: ProtectedRoute + full router skeleton with stub pages

**Files:**
- Create: `src/components/routing/ProtectedRoute.tsx`
- Create: `src/layouts/MarketingLayout.tsx` (bare `<Outlet/>` for now — Task 9 fills in Nav/Footer/modals)
- Create: `src/layouts/AppLayout.tsx` (bare shell for now — Task 15 fills in Sidebar)
- Create stub pages: `src/pages/HomePage.tsx`, `src/pages/JourneyPage.tsx`, `src/pages/OnboardingPage.tsx`, `src/pages/app/DashboardPage.tsx`, `src/pages/app/ChatPage.tsx`, `src/pages/app/PlannerPage.tsx`, `src/pages/app/FocusRoomPage.tsx`, `src/pages/app/ProgressPage.tsx`
- Create: `src/router.tsx`
- Modify: `src/main.tsx` (mount `RouterProvider`)

**Interfaces:**
- Consumes: `useAuth()` from Task 5.
- Produces: the full route tree (`/`, `/journey`, `/onboarding`, `/app/dashboard`, `/app/chat`, `/app/planner`, `/app/focus-room`, `/app/progress`), navigable end-to-end before any real content exists. Every later page task edits one of these stub files in place rather than creating a new route.

Note: `/app/progress` and `ProgressPage` were added after this task was originally written — a `progress.html` page (stat cards, 7-day activity chart, recently-completed list) was added to the legacy static site alongside the other app pages, with its sidebar nav link enabled (no "Soon" badge) in `chat.html`/`dashboard.html`/`planner.html`. It follows the exact same pattern as `dashboard.html`/`chat.html`/`planner.html`/`focus-room.html`, so it gets the same treatment: moved to `/legacy/progress.html` (handled by Task 20), with a placeholder React route here.

- [ ] **Step 1: Install react-router-dom**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Create `src/components/routing/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  require: 'session' | 'profile';
}

export function ProtectedRoute({ require }: ProtectedRouteProps) {
  const { session, profile, profileLoading } = useAuth();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (require === 'profile') {
    if (profileLoading) {
      return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;
    }
    if (!profile) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <Outlet />;
}
```

- [ ] **Step 3: Create `src/layouts/MarketingLayout.tsx` (bare version)**

```tsx
import { Outlet } from 'react-router-dom';

export function MarketingLayout() {
  return <Outlet />;
}
```

- [ ] **Step 4: Create `src/layouts/AppLayout.tsx` (bare version)**

```tsx
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 5: Create stub pages**

`src/pages/HomePage.tsx`:
```tsx
export function HomePage() {
  return <div>Home (WIP)</div>;
}
```

`src/pages/JourneyPage.tsx`:
```tsx
export function JourneyPage() {
  return <div>Journey (WIP)</div>;
}
```

`src/pages/OnboardingPage.tsx`:
```tsx
export function OnboardingPage() {
  return <div>Onboarding (WIP)</div>;
}
```

`src/pages/app/DashboardPage.tsx`:
```tsx
export function DashboardPage() {
  return <div>Dashboard (WIP)</div>;
}
```

`src/pages/app/ChatPage.tsx`:
```tsx
export function ChatPage() {
  return <div>Chat (WIP)</div>;
}
```

`src/pages/app/PlannerPage.tsx`:
```tsx
export function PlannerPage() {
  return <div>Planner (WIP)</div>;
}
```

`src/pages/app/FocusRoomPage.tsx`:
```tsx
export function FocusRoomPage() {
  return <div>Focus Room (WIP)</div>;
}
```

`src/pages/app/ProgressPage.tsx`:
```tsx
export function ProgressPage() {
  return <div>Progress (WIP)</div>;
}
```

- [ ] **Step 6: Create `src/router.tsx`**

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MarketingLayout } from './layouts/MarketingLayout';
import { HomePage } from './pages/HomePage';
import { JourneyPage } from './pages/JourneyPage';
import { ProtectedRoute } from './components/routing/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/journey', element: <JourneyPage /> },
    ],
  },
  {
    element: <ProtectedRoute require="session" />,
    children: [
      {
        path: '/onboarding',
        lazy: () => import('./pages/OnboardingPage').then((m) => ({ Component: m.OnboardingPage })),
      },
    ],
  },
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
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
```

- [ ] **Step 7: Mount the router in `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
```

- [ ] **Step 8: Verify**

```bash
npm run build
```

Expected: exits 0. Then run `npm run dev`, open the printed local URL, and confirm `/`, `/journey` render their WIP text, and `/app/dashboard` redirects to `/` (no session yet).

- [ ] **Step 9: Commit**

```bash
git add src/router.tsx src/main.tsx src/layouts src/pages src/components/routing package.json package-lock.json
git commit -m "Add router skeleton with protected routes and stub pages"
```

---

## Task 7: Reveal and scroll-to-hash hooks

**Files:**
- Create: `src/hooks/useReveal.ts`
- Create: `src/hooks/useScrollToHash.ts`

**Interfaces:**
- Produces: `useReveal<T extends HTMLElement>(extraClassName?: string): { ref: RefObject<T>; className: string }` — attach `ref` and `className` directly to any element that had the `.reveal` class in the original markup. `useScrollToHash(): void` — call once in `HomePage` to replicate anchor-link scrolling.

- [ ] **Step 1: Create `src/hooks/useReveal.ts`**

```ts
import { useEffect, useRef, useState, type RefObject } from 'react';

export function useReveal<T extends HTMLElement>(extraClassName = ''): { ref: RefObject<T>; className: string } {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const className = ['reveal', visible ? 'visible' : '', extraClassName].filter(Boolean).join(' ');
  return { ref, className };
}
```

- [ ] **Step 2: Create `src/hooks/useScrollToHash.ts`**

```ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToHash(): void {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: exits 0 (hooks aren't used anywhere yet, but must type-check standalone).

- [ ] **Step 4: Commit**

```bash
git add src/hooks
git commit -m "Add useReveal and useScrollToHash hooks"
```

---

## Task 8: Nav and Footer components

**Files:**
- Create: `src/components/layout/Nav.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/layouts/MarketingLayout.tsx` (render `Nav` + `Footer` around the outlet)

**Interfaces:**
- Consumes: `useAuth()` (for `openSignupModal`).
- Produces: `Nav`, `Footer` — rendered by `MarketingLayout` for every marketing page.

- [ ] **Step 1: Create `src/components/layout/Nav.tsx`**

```tsx
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { href: '/#hero', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/#features', label: 'Features' },
  { href: '/#nesh', label: 'NESH AI' },
  { href: '/#robot', label: 'Robot' },
  { href: '/#contact', label: 'Contact' },
];

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openSignupModal } = useAuth();

  useEffect(() => {
    function onScroll() {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 50);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
  }

  function handleDownloadClick(e: MouseEvent) {
    e.preventDefault();
    alert('App download coming soon!');
  }

  function handleSignupClick(e: MouseEvent) {
    e.preventDefault();
    openSignupModal();
  }

  return (
    <nav ref={navRef}>
      <Link to="/#hero" className="logo">
        <img src="/assets/logo.png" alt="Obscura logo" />
        OBSCURA
      </Link>
      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link to={link.href}>{link.label}</Link>
          </li>
        ))}
        <li><a href="#" onClick={handleDownloadClick}>Download</a></li>
        <li><a href="#download" className="nav-cta" onClick={handleSignupClick}>Sign Up</a></li>
      </ul>
      <div className={`hamburger${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen((o) => !o)}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} to={link.href} onClick={closeMobile}>{link.label}</Link>
        ))}
        <a href="#" onClick={(e) => { handleDownloadClick(e); closeMobile(); }}>Download</a>
        <a href="#download" onClick={(e) => { handleSignupClick(e); closeMobile(); }}>Sign Up</a>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create `src/components/layout/Footer.tsx`**

```tsx
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-col footer-brand">
          <Link to="/#hero" className="logo footer-logo">
            <img src="/assets/logo.png" alt="Obscura logo" />
            OBSCURA
          </Link>
          <p className="footer-tagline">Your all-in-one study companion, built for O/L and A/L students, everywhere.</p>
          <div className="footer-socials">
            <a href="https://www.instagram.com/obscura.edux/" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth={1.8} />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth={1.8} />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
              </svg>
            </a>
            <a href="https://x.com/" target="_blank" rel="noreferrer" className="social-icon" aria-label="X">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </a>
            <a href="mailto:obscurabytechlume@gmail.com" className="social-icon" aria-label="Email">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth={1.8} />
                <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link to="/#hero">Home</Link>
          <Link to="/#about">About</Link>
          <Link to="/#features">Features</Link>
          <Link to="/#contact">Contact</Link>
        </div>

        <div className="footer-col">
          <h4>Features</h4>
          <Link to="/#features">NESH AI Chat</Link>
          <Link to="/#features">Past Papers</Link>
          <Link to="/#features">Pomodoro Timer</Link>
          <Link to="/#features">Flashcards</Link>
        </div>

        <div className="footer-col">
          <h4>Get in Touch</h4>
          <a href="mailto:obscurabytechlume@gmail.com" className="footer-contact-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth={1.8} />
              <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            obscurabytechlume@gmail.com
          </a>
          <a href="https://www.instagram.com/obscura.edux/" target="_blank" rel="noreferrer" className="footer-contact-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth={1.8} />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth={1.8} />
              <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
            </svg>
            Instagram
          </a>
          <a href="https://x.com/" target="_blank" rel="noreferrer" className="footer-contact-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
            Twitter
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Obscura. All rights reserved. Built for VisioNEX Inter-School Hackathon Competition.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update `src/layouts/MarketingLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Footer } from '../components/layout/Footer';

export function MarketingLayout() {
  return (
    <>
      <Nav />
      <Outlet />
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: exits 0. Then `npm run dev` and confirm the nav bar and footer render on `/` and `/journey` with correct logo/links, and the hamburger toggles the mobile menu below 900px viewport width.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout src/layouts/MarketingLayout.tsx
git commit -m "Add Nav and Footer components"
```

---

## Task 9: SignupLoginModal and NewsletterModal

**Files:**
- Create: `src/components/modals/SignupLoginModal.tsx`
- Create: `src/components/modals/NewsletterModal.tsx`
- Modify: `src/layouts/MarketingLayout.tsx` (render both modals)

**Interfaces:**
- Consumes: `useAuth()` (session, authModalMode, closeAuthModal, signUp, signIn), `supabase` (profile lookup on signup "Done", newsletter insert).
- Produces: the two modals, always mounted in `MarketingLayout`; every "Sign Up" trigger elsewhere in the app just calls `openSignupModal()` from `useAuth()`.

- [ ] **Step 1: Create `src/components/modals/SignupLoginModal.tsx`**

```tsx
import { useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type View = 'form' | 'success';

export function SignupLoginModal() {
  const { authModalMode, closeAuthModal, openSignupModal, openLoginModal, signUp, signIn, session } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState('');

  if (!authModalMode) return null;

  const isSignup = authModalMode === 'signup';

  function resetAndClose() {
    setView('form');
    setEmail('');
    setPassword('');
    setError('');
    closeAuthModal();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        const { hasSession } = await signUp(email, password);
        setSuccessText(hasSession
          ? 'Your account is ready. Welcome to Obscura!'
          : 'Almost there — check your inbox to confirm your email.');
      } else {
        await signIn(email, password);
        setSuccessText("Welcome back! You're logged in.");
      }
      setView('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDone() {
    if (!session) {
      resetAndClose();
      return;
    }
    const { data } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();
    resetAndClose();
    navigate(data ? '/app/dashboard' : '/onboarding');
  }

  function switchMode(e: MouseEvent) {
    e.preventDefault();
    setError('');
    setEmail('');
    setPassword('');
    if (isSignup) openLoginModal(); else openSignupModal();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}>
      <div className="modal-card">
        <button className="modal-close" type="button" aria-label="Close" onClick={resetAndClose}>&times;</button>

        {view === 'form' && (
          <form className="modal-form" onSubmit={handleSubmit}>
            <img src="/assets/logo.png" alt="Obscura logo" className="modal-logo" />
            <h3>{isSignup ? 'Create your account' : 'Welcome back'}</h3>
            <p className="modal-sub">
              {isSignup
                ? 'Get instant access to Obscura on the web, no app download needed.'
                : 'Log in to continue with Obscura.'}
            </p>

            <label htmlFor="authEmail">Email</label>
            <input
              type="email"
              id="authEmail"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="authPassword">Password</label>
            <input
              type="password"
              id="authPassword"
              required
              minLength={isSignup ? 8 : undefined}
              placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className="modal-error visible">{error}</div>}

            <button type="submit" className="btn-primary modal-submit" disabled={submitting}>
              {submitting ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? 'Create Account' : 'Log In')}
            </button>
            <p className="modal-switch">
              {isSignup ? (
                <>Already have an account? <a href="#" onClick={switchMode}>Log in</a></>
              ) : (
                <>Don&apos;t have an account? <a href="#" onClick={switchMode}>Sign up</a></>
              )}
            </p>
          </form>
        )}

        {view === 'success' && (
          <div className="modal-success" style={{ display: 'block' }}>
            <h3>{isSignup ? "You're in!" : 'Welcome back!'}</h3>
            <p>{successText}</p>
            <button className="btn-primary" type="button" onClick={handleDone}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/modals/NewsletterModal.tsx`**

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export function NewsletterModal() {
  const { authModalMode } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed && authModalMode === null) {
        setOpen(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
    // Intentionally runs once on mount, matching the original 4s-delay popup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setOpen(false);
    setDismissed(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('newsletter_subscribers').insert({ email });
      if (insertError) {
        const message = insertError.code === '23505' ? "You're already on the list!" : insertError.message;
        throw new Error(message);
      }
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="newsletter-overlay open" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="newsletter-card">
        <button className="modal-close" type="button" aria-label="Close" onClick={close}>&times;</button>
        <img src="/assets/mascot_wave.png" alt="NESH waving" className="newsletter-mascot" />
        {!subscribed ? (
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <h3>Get study tips from NESH</h3>
            <p className="modal-sub">NESH will send you helpful tips and updates straight to your inbox, no spam, unsubscribe anytime.</p>
            <input
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <div className="modal-error visible">{error}</div>}
            <button type="submit" className="btn-primary modal-submit" disabled={submitting}>
              {submitting ? 'Subscribing...' : 'Subscribe'}
            </button>
            <a href="#" className="modal-switch-plain" onClick={(e) => { e.preventDefault(); close(); }}>No thanks</a>
          </form>
        ) : (
          <div className="newsletter-success" style={{ display: 'block' }}>
            <h3>You&apos;re subscribed!</h3>
            <p>Thanks for joining, we&apos;ll keep you posted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/layouts/MarketingLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Footer } from '../components/layout/Footer';
import { SignupLoginModal } from '../components/modals/SignupLoginModal';
import { NewsletterModal } from '../components/modals/NewsletterModal';

export function MarketingLayout() {
  return (
    <>
      <Nav />
      <Outlet />
      <Footer />
      <SignupLoginModal />
      <NewsletterModal />
    </>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

Expected: exits 0. Then `npm run dev`: click "Sign Up" in the nav, confirm the modal opens with the create-account form; wait 4s on a fresh load and confirm the newsletter popup appears (unless the signup modal is already open).

- [ ] **Step 5: Commit**

```bash
git add src/components/modals src/layouts/MarketingLayout.tsx
git commit -m "Add SignupLoginModal and NewsletterModal"
```

---

## Task 10: Hero and About sections

**Files:**
- Create: `src/components/marketing/Hero.tsx`
- Create: `src/components/marketing/About.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Hero's "Get Started" button), `useReveal()`.
- Produces: `Hero`, `About` — composed into `HomePage` in Task 13.

- [ ] **Step 1: Create `src/components/marketing/Hero.tsx`**

```tsx
import type { MouseEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Hero() {
  const { openSignupModal } = useAuth();

  function handleGetStarted(e: MouseEvent) {
    e.preventDefault();
    openSignupModal();
  }

  return (
    <section className="hero" id="hero">
      <video className="hero-video" autoPlay muted loop playsInline>
        <source src="/assets/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1>Study smarter.<br />Score <span className="accent">higher.</span></h1>
        <p>Meet NESH, your AI-powered study companion built for O/L and A/L students. Past papers, smart planning, and real-time help, all in one place.</p>
        <a href="#download" className="btn-primary" onClick={handleGetStarted}>Get Started</a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/marketing/About.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';

export function About() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const body1 = useReveal<HTMLParagraphElement>();
  const body2 = useReveal<HTMLParagraphElement>();
  const journeyBtn = useReveal<HTMLAnchorElement>();
  const image = useReveal<HTMLDivElement>();

  return (
    <section className="about" id="about">
      <div className="about-inner">
        <div className="about-text">
          <div ref={label.ref} className={label.className}>About</div>
          <h2 ref={title.ref} className={title.className}>Built for students.<br />Powered by AI.</h2>
          <p ref={body1.ref} className={`${body1.className} about-body`}>Obscura is a project built by a passionate team of Sri Lankan students who know exactly how stressful O/L and A/L exams can be. We built the tool we wish we had.</p>
          <p ref={body2.ref} className={`${body2.className} about-body`}>NESH is our AI tutor, trained on real past papers, available in English, Sinhala, and Tamil, and designed to feel like a brilliant friend who always has time for you.</p>
          <Link ref={journeyBtn.ref} to="/journey" className={`${journeyBtn.className} plan-btn outline about-journey-btn`}>See how we built this →</Link>
        </div>
        <div ref={image.ref} className={`${image.className} about-image`}>
          <img src="/assets/mascot_wave.png" alt="NESH waving" className="about-mascot" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: exits 0 (not yet rendered anywhere, but must type-check standalone).

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Hero.tsx src/components/marketing/About.tsx
git commit -m "Add Hero and About marketing components"
```

---

## Task 11: Features and Plans sections

**Files:**
- Create: `src/components/marketing/Features.tsx`
- Create: `src/components/marketing/Plans.tsx`

**Interfaces:**
- Consumes: `useReveal()`, `useAuth()` (Plans' "Get Started" buttons).
- Produces: `Features`, `Plans` — composed into `HomePage` in Task 13.

- [ ] **Step 1: Create `src/components/marketing/Features.tsx`**

```tsx
import type { ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface Feature {
  colorClass: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    colorClass: 'purple',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
        <circle cx="9" cy="10" r="1.1" fill="currentColor" />
        <circle cx="12" cy="10" r="1.1" fill="currentColor" />
        <circle cx="15" cy="10" r="1.1" fill="currentColor" />
      </svg>
    ),
    title: 'NESH AI Chat',
    description: 'Ask anything, NESH searches real past papers and explains concepts clearly in your language.',
  },
  {
    colorClass: 'orange',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.5 3.5h8l3 3v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M14 3.5v3h3" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M8.5 12.5h7M8.5 15.5h7M8.5 18h4.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
    ),
    title: 'Past Papers',
    description: 'Access years of O/L and A/L past papers, track your scores, and identify weak areas over time.',
  },
  {
    colorClass: 'red',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth={1.8} />
        <path d="M12 9v4l2.6 2.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 2.5h5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      </svg>
    ),
    title: 'Pomodoro Timer',
    description: 'Study in focused sprints with short breaks, a proven technique to stay sharp without burning out.',
  },
  {
    colorClass: 'green',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5.5" y="7.5" width="12" height="14" rx="2" transform="rotate(-8 11.5 14.5)" stroke="currentColor" strokeWidth={1.7} />
        <rect x="7" y="4" width="12" height="14" rx="2" fill="#F9F7FF" stroke="currentColor" strokeWidth={1.7} />
        <path d="M10 9h6M10 12h6M10 15h3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    ),
    title: 'Smart Flashcards',
    description: 'Create and review flashcard decks for any subject, track progress, and master key concepts fast.',
  },
  {
    colorClass: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth={1.8} />
        <path d="M4 9.5h16" stroke="currentColor" strokeWidth={1.8} />
        <path d="M8 3v3.2M16 3v3.2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="8.3" cy="13" r="1" fill="currentColor" />
        <circle cx="12" cy="13" r="1" fill="currentColor" />
        <circle cx="15.7" cy="13" r="1" fill="currentColor" />
        <circle cx="8.3" cy="16.5" r="1" fill="currentColor" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
    ),
    title: 'Study Planner',
    description: 'Plan your week around your syllabus and exam dates, stay organised, and never miss a deadline.',
  },
  {
    colorClass: 'teal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth={1.8} />
        <path d="M15.3 15.3 20 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        <path d="M8 10.5h5M10.5 8v5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      </svg>
    ),
    title: 'Quick Search',
    description: 'Search semantically across every past paper, find exactly what you need even without exact keywords.',
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const card = useReveal<HTMLDivElement>();
  return (
    <div ref={card.ref} className={`${card.className} feature-card`}>
      <div className={`feature-icon-box ${feature.colorClass}`}>{feature.icon}</div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  );
}

export function Features() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();

  return (
    <section className="features" id="features">
      <div ref={label.ref} className={label.className}>Features</div>
      <h2 ref={title.ref} className={title.className}>Everything you need to ace your exams</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>6+ powerful tools, one app, built around how students actually study.</p>
      <div className="features-grid">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/marketing/Plans.tsx`**

```tsx
import type { MouseEvent } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { useAuth } from '../../context/AuthContext';

const COMPARISON_ROWS: [string, string, string][] = [
  ['NESH AI Chat', 'Limited', '✓ Unlimited'],
  ['Past Papers', '5/month', '✓ Unlimited'],
  ['Pomodoro Timer', '✓', '✓'],
  ['Flashcards', '✓ Basic', '✓ Unlimited'],
  ['Study Planner', '✓', '✓'],
  ['AI Study Plan', '✗', '✓'],
  ['Analytics Dashboard', '✗', '✓'],
  ['RAG Smart Search', '✗', '✓'],
  ['Sinhala and Tamil support', '✓', '✓'],
  ['Priority Support', '✗', '✓'],
];

export function Plans() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const grid = useReveal<HTMLDivElement>();
  const table = useReveal<HTMLDivElement>();
  const { openSignupModal } = useAuth();

  function handleSignup(e: MouseEvent) {
    e.preventDefault();
    openSignupModal();
  }

  return (
    <section className="unlock-section" id="unlock">
      <div ref={label.ref} className={label.className}>Plans</div>
      <h2 ref={title.ref} className={title.className}>Unlock more with Obscura</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>Choose what works for you, start free, upgrade when you're ready.</p>

      <div ref={grid.ref} className={`${grid.className} plans-grid`}>
        <div className="plan-card">
          <h3>Free Forever</h3>
          <p className="plan-desc">Essential tools to get started.</p>
          <div className="plan-price">Rs. 0 <span>/month</span></div>
          <ul className="plan-features">
            <li>✓ NESH AI Chat (limited)</li>
            <li>✓ 5 Past Papers per month</li>
            <li>✓ Pomodoro Timer</li>
            <li>✓ Basic Flashcards</li>
            <li className="no">✗ Unlimited Past Papers</li>
            <li className="no">✗ AI Study Plan</li>
            <li className="no">✗ Analytics Dashboard</li>
            <li className="no">✗ RAG Smart Search</li>
          </ul>
          <a href="#download" className="plan-btn outline" onClick={handleSignup}>Get Started</a>
        </div>
        <div className="plan-card featured">
          <div className="plan-badge">Most Popular</div>
          <h3>Obscura Pro</h3>
          <p className="plan-desc">Everything you need to ace exams.</p>
          <div className="plan-price">Rs. 990 <span>/month</span></div>
          <ul className="plan-features">
            <li>✓ Unlimited NESH AI Chat</li>
            <li>✓ Unlimited Past Papers</li>
            <li>✓ Pomodoro Timer</li>
            <li>✓ Unlimited Flashcards</li>
            <li>✓ AI Study Plan</li>
            <li>✓ Analytics Dashboard</li>
            <li>✓ RAG Smart Search</li>
            <li>✓ Priority Support</li>
          </ul>
          <a href="#download" className="plan-btn filled" onClick={handleSignup}>Get Started</a>
        </div>
      </div>

      <div ref={table.ref} className={`${table.className} comparison-table`}>
        <h3 className="comparison-title">Feature Comparison</h3>
        <table>
          <thead>
            <tr><th>Feature</th><th>Free</th><th>Pro</th></tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([feature, free, pro]) => (
              <tr key={feature}><td>{feature}</td><td>{free}</td><td>{pro}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Features.tsx src/components/marketing/Plans.tsx
git commit -m "Add Features and Plans marketing components"
```

---

## Task 12: NeshSection and PomodoroTryout

**Files:**
- Create: `src/components/marketing/NeshSection.tsx`
- Create: `src/components/marketing/PomodoroTryout.tsx`

**Interfaces:**
- Consumes: `useReveal()`.
- Produces: `NeshSection` (static phone-mockup preview), `PomodoroTryout` (stateful schedule generator + timer, ported from the original `script.js`).

- [ ] **Step 1: Create `src/components/marketing/NeshSection.tsx`**

```tsx
import { useReveal } from '../../hooks/useReveal';

const CHIPS = [
  'Answers from past papers',
  'English, Sinhala and Tamil',
  'O/L and A/L focused',
  'Remembers your conversation',
  'Instant responses',
];

function NeshChip({ text }: { text: string }) {
  const chip = useReveal<HTMLSpanElement>();
  return <span ref={chip.ref} className={`${chip.className} nesh-chip`}>{text}</span>;
}

export function NeshSection() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const body = useReveal<HTMLParagraphElement>();
  const screenshot = useReveal<HTMLDivElement>();

  return (
    <section className="nesh-section" id="nesh">
      <div className="nesh-inner">
        <div className="nesh-text">
          <div ref={label.ref} className={label.className}>NESH AI</div>
          <h2 ref={title.ref} className={title.className}>Your personal AI tutor.<br />Available 24/7.</h2>
          <p ref={body.ref} className={`${body.className} about-body`}>NESH is trained on real past papers, so every answer is grounded, accurate, and built for your syllabus. Ask in English, Sinhala, or Tamil.</p>
          <div className="nesh-chips-vertical">
            {CHIPS.map((chip) => <NeshChip key={chip} text={chip} />)}
          </div>
        </div>
        <div ref={screenshot.ref} className={`${screenshot.className} nesh-screenshot`}>
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="chat-header-mock">
                <div className="chat-avatar-mock" style={{ overflow: 'hidden', padding: 0 }}>
                  <img src="/assets/mascot_study.png" alt="NESH" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                </div>
                <div>
                  <div className="chat-name">NESH AI</div>
                  <div className="chat-status">● Online</div>
                </div>
              </div>
              <div className="chat-messages">
                <div className="chat-bubble user-bubble">Explain the law of demand</div>
                <div className="chat-bubble nesh-bubble">The law of demand states that as price increases, quantity demanded decreases — all else equal. Your 2022 Economics paper covers this in Section B!</div>
                <div className="chat-bubble user-bubble">Give me a practice question</div>
                <div className="chat-bubble nesh-bubble">Sure! "Explain using a diagram how a rise in price affects consumer demand for rice in Sri Lanka." (4 marks)</div>
              </div>
              <div className="chat-input-mock">
                <div className="chat-input-field">Ask NESH anything...</div>
                <div className="chat-send-btn">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
                    <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/marketing/PomodoroTryout.tsx`**

```tsx
import { useRef, useState } from 'react';
import { useReveal } from '../../hooks/useReveal';

type BlockType = 'focus' | 'break';
interface ScheduleBlock {
  type: BlockType;
  label: string;
  minutes: number;
}

const HOUR_OPTIONS = [1, 2, 3, 4, 6];
const FOCUS_LENGTH = 25;
const SHORT_BREAK = 5;
const LONG_BREAK = 15;

function buildSchedule(hours: number): ScheduleBlock[] {
  const totalMinutes = hours * 60;
  const schedule: ScheduleBlock[] = [];
  let usedMinutes = 0;
  let sessionCount = 0;

  while (usedMinutes + FOCUS_LENGTH <= totalMinutes) {
    sessionCount++;
    schedule.push({ type: 'focus', label: `Focus Session ${sessionCount}`, minutes: FOCUS_LENGTH });
    usedMinutes += FOCUS_LENGTH;

    if (usedMinutes + 5 > totalMinutes) break;

    const isLongBreak = sessionCount % 4 === 0;
    const breakLength = isLongBreak ? LONG_BREAK : SHORT_BREAK;

    if (usedMinutes + breakLength <= totalMinutes) {
      schedule.push({ type: 'break', label: isLongBreak ? 'Long Break' : 'Short Break', minutes: breakLength });
      usedMinutes += breakLength;
    }
  }

  return schedule;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60).toString().padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function PomodoroTryout() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const box = useReveal<HTMLDivElement>();

  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [displaySchedule, setDisplaySchedule] = useState<ScheduleBlock[]>([]);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [displayBlockIndex, setDisplayBlockIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [done, setDone] = useState(false);

  const scheduleRef = useRef<ScheduleBlock[]>([]);
  const secondsRef = useRef(0);
  const blockIndexRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  function clearTimer() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startBlock(index: number) {
    clearTimer();
    const blocks = scheduleRef.current;
    if (index >= blocks.length) {
      setDone(true);
      setDisplaySeconds(0);
      return;
    }
    setDone(false);
    blockIndexRef.current = index;
    setDisplayBlockIndex(index);
    secondsRef.current = blocks[index].minutes * 60;
    setDisplaySeconds(secondsRef.current);
    intervalRef.current = window.setInterval(() => {
      secondsRef.current -= 1;
      if (secondsRef.current < 0) {
        startBlock(blockIndexRef.current + 1);
        return;
      }
      setDisplaySeconds(secondsRef.current);
    }, 1000);
  }

  function handleGeneratePlan() {
    if (!selectedHours) {
      alert('Please select how many hours you are studying today!');
      return;
    }
    const blocks = buildSchedule(selectedHours);
    scheduleRef.current = blocks;
    setDisplaySchedule(blocks);
    setStarted(true);
  }

  function handleStartTimer() {
    setTimerVisible(true);
    startBlock(0);
  }

  function handlePause() {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) clearTimer(); else startBlock(blockIndexRef.current);
      return next;
    });
  }

  function handleSkip() {
    startBlock(blockIndexRef.current + 1);
  }

  function handleReset() {
    clearTimer();
    setSelectedHours(null);
    setStarted(false);
    setTimerVisible(false);
    setDisplaySchedule([]);
    setDisplaySeconds(0);
    setDisplayBlockIndex(0);
    setIsPaused(false);
    setDone(false);
    scheduleRef.current = [];
    secondsRef.current = 0;
    blockIndexRef.current = 0;
  }

  const focusSessionCount = displaySchedule.filter((b) => b.type === 'focus').length;
  const currentLabel = done ? 'All done!' : displaySchedule[displayBlockIndex]?.label ?? '';

  return (
    <section className="pomodoro-section" id="pomodoro">
      <div ref={label.ref} className={label.className}>Try It Free</div>
      <h2 ref={title.ref} className={title.className}>Plan today's study session</h2>
      <p ref={sub.ref} className={sub.className}>Tell us how many hours you've got, we'll build you a focused Pomodoro schedule instantly.</p>

      <div ref={box.ref} className={`${box.className} pomodoro-box`}>
        {!started ? (
          <div className="pomodoro-input-row">
            <label htmlFor="studyHours">How many hours are you studying today?</label>
            <div className="hour-options">
              {HOUR_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`hour-btn${selectedHours === h ? ' selected' : ''}`}
                  onClick={() => setSelectedHours(h)}
                >
                  {h} hr{h > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <button type="button" className="btn-primary" style={{ marginTop: 24 }} onClick={handleGeneratePlan}>
              Generate My Plan
            </button>
          </div>
        ) : (
          <div className="pomodoro-result">
            <div className="plan-summary">
              {focusSessionCount} focus sessions planned for your {selectedHours} hour{selectedHours && selectedHours > 1 ? 's' : ''} of study
            </div>
            <div className="plan-schedule">
              {displaySchedule.map((block, i) => (
                <div key={i} className={`schedule-block ${block.type}`}>
                  <span>{block.label}</span>
                  <span>{block.minutes} min</span>
                </div>
              ))}
            </div>

            {timerVisible && (
              <div className="timer-display">
                <div className="timer-label">{currentLabel}</div>
                <div className="timer-clock">{done ? '00:00' : formatClock(displaySeconds)}</div>
                <div className="timer-controls">
                  <button type="button" className="timer-btn" onClick={handlePause}>{isPaused ? 'Resume' : 'Pause'}</button>
                  <button type="button" className="timer-btn skip" onClick={handleSkip}>Skip</button>
                </div>
              </div>
            )}

            {!timerVisible && (
              <button type="button" className="btn-primary" style={{ marginTop: 20 }} onClick={handleStartTimer}>
                Start First Session
              </button>
            )}
            <button type="button" className="plan-reset" onClick={handleReset}>Start Over</button>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/NeshSection.tsx src/components/marketing/PomodoroTryout.tsx
git commit -m "Add NeshSection and PomodoroTryout components"
```

---

## Task 13: RobotSection, SnacksSection, Testimonials, Contact

**Files:**
- Create: `src/types/model-viewer.d.ts`
- Create: `src/components/marketing/RobotSection.tsx`
- Create: `src/components/marketing/SnacksSection.tsx`
- Create: `src/components/marketing/Testimonials.tsx`
- Create: `src/components/marketing/Contact.tsx`

**Interfaces:**
- Consumes: `useReveal()`, `useAuth()` (RobotSection's "Notify Me" button).
- Produces: the four remaining marketing sections, composed into `HomePage` in Task 14.

- [ ] **Step 1: Install the model-viewer package**

```bash
npm install @google/model-viewer
```

- [ ] **Step 2: Create `src/types/model-viewer.d.ts`**

```ts
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'camera-controls'?: boolean;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        'shadow-intensity'?: string;
        exposure?: string;
        'shadow-softness'?: string;
        'environment-image'?: string;
      };
    }
  }
}

export {};
```

- [ ] **Step 3: Create `src/components/marketing/RobotSection.tsx`**

```tsx
import '@google/model-viewer';
import { useReveal } from '../../hooks/useReveal';
import { useAuth } from '../../context/AuthContext';

export function RobotSection() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const viewer = useReveal<HTMLDivElement>();
  const { openSignupModal } = useAuth();

  return (
    <section className="robot-section" id="robot">
      <div ref={label.ref} className={label.className}>IoT Companion</div>
      <h2 ref={title.ref} className={title.className}>Meet NESH in real life.</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>A physical AI robot companion, press a button, ask NESH anything, get a voice response. Coming soon.</p>
      <div ref={viewer.ref} className={`${viewer.className} robot-viewer`}>
        <model-viewer
          src="/assets/nesh-robot.glb"
          alt="NESH Robot 3D model"
          camera-controls
          camera-orbit="0deg 75deg 105%"
          field-of-view="30deg"
          shadow-intensity="1.4"
          exposure="0.75"
          shadow-softness="0.8"
          environment-image="neutral"
          style={{ width: '100%', height: 500, borderRadius: 20, background: '#0D0814' }}
        ></model-viewer>
        <div className="robot-overlay">
          <button type="button" className="robot-overlay-btn" onClick={() => openSignupModal()}>Notify Me</button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/components/marketing/SnacksSection.tsx`**

```tsx
import { useReveal } from '../../hooks/useReveal';

export function SnacksSection() {
  const label = useReveal<HTMLDivElement>();
  const quote = useReveal<HTMLParagraphElement>();
  const body = useReveal<HTMLParagraphElement>();
  const btns = useReveal<HTMLDivElement>();
  const small = useReveal<HTMLParagraphElement>();
  const image = useReveal<HTMLDivElement>();

  return (
    <section className="snacks-section" id="snacks">
      <div className="snacks-inner">
        <div className="snacks-text">
          <div ref={label.ref} className={label.className}>NESH Needs Fuel</div>
          <p ref={quote.ref} className={`${quote.className} snacks-quote`}>" Help me stay sharp and snappy! "</p>
          <p ref={body.ref} className={`${body.className} snacks-body`}><strong>This app will always be free to use.</strong> But if you'd like to support our mission, feel free to feed the fox. Any amount helps!</p>
          <div ref={btns.ref} className={`${btns.className} snacks-btns`}>
            <a href="https://buymeacoffee.com/yourlink" target="_blank" rel="noreferrer" className="snacks-btn coffee">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
                <path d="M5 9h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
                <path d="M17 10.5h1.5a2.2 2.2 0 0 1 0 4.4H17" stroke="currentColor" strokeWidth={1.6} />
                <path d="M8.5 6c0-1 .8-1 .8-2M12 6c0-1 .8-1 .8-2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
              </svg>
              Buy NESH a Coffee
            </a>
            <a href="https://paypal.me/yourlink" target="_blank" rel="noreferrer" className="snacks-btn paypal">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16 }}>
                <path d="M8 5.5h6.2c2.3 0 3.8 1.4 3.4 3.6-.5 2.7-2.4 4-4.9 4H10l-1 5.4" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
                <path d="M9.5 9.5H15c2.1 0 3.4 1.3 3 3.4-.4 2.4-2.2 3.6-4.5 3.6h-2.3l-.9 4.9" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" opacity={0.55} />
              </svg>
              PayPal
            </a>
          </div>
          <p ref={small.ref} className={`${small.className} snacks-small`}>Every contribution helps us keep improving and maintaining this free service for everyone.</p>
        </div>
        <div ref={image.ref} className={`${image.className} snacks-image`}>
          <img src="/assets/mascot_sad.png" alt="NESH needs fuel" className="snacks-mascot-big" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `src/components/marketing/Testimonials.tsx`**

```tsx
import { useRef } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  { initials: 'SP', name: 'Mrs. S. Perera', role: 'Mathematics Teacher', quote: "My students use NESH to revise past papers on their own time, and I've genuinely seen their exam confidence improve this term." },
  { initials: 'RJ', name: 'Mr. R. Jayasinghe', role: 'Economics Teacher', quote: 'Having answers grounded in real past papers instead of generic explanations makes a real difference for A/L students under pressure.' },
  { initials: 'NF', name: 'Mrs. N. Fernando', role: 'Science Teacher', quote: "I recommend the Pomodoro planner to every student I mentor. It's such a simple idea, but it actually gets them to sit down and study." },
];

export function Testimonials() {
  const rating = useReveal<HTMLDivElement>();
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(amount: number) {
    trackRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="testimonials-inner">
        <div ref={rating.ref} className={`${rating.className} testimonials-rating`}>
          <div className="rating-number">4.8</div>
          <div className="rating-stars-big">★★★★★</div>
          <div className="rating-label">Excellent</div>
          <div className="rating-count">Based on early feedback</div>
          <div className="rating-source">from teachers &amp; students</div>
        </div>

        <div className="testimonials-scroll-wrap">
          <button className="testimonial-arrow left" aria-label="Previous" onClick={() => scroll(-320)}>‹</button>
          <div className="testimonials-track" ref={trackRef}>
            {TESTIMONIALS.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-card-head">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-quote">"{t.quote}"</p>
              </div>
            ))}
          </div>
          <button className="testimonial-arrow right" aria-label="Next" onClick={() => scroll(320)}>›</button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create `src/components/marketing/Contact.tsx`**

```tsx
import { useReveal } from '../../hooks/useReveal';

export function Contact() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const links = useReveal<HTMLDivElement>();

  return (
    <section className="contact-section" id="contact">
      <div ref={label.ref} className={label.className}>Contact</div>
      <h2 ref={title.ref} className={title.className}>Get in touch.</h2>
      <p ref={sub.ref} className={`${sub.className} section-sub`}>Questions, feedback, or just want to say hi to the fox? We'd love to hear from you.</p>
      <div ref={links.ref} className={`${links.className} contact-links`}>
        <a href="mailto:obscurabytechlume@gmail.com" className="contact-link">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth={1.8} />
            <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          obscurabytechlume@gmail.com
        </a>
        <a href="https://www.instagram.com/obscura.edux/" target="_blank" rel="noreferrer" className="contact-link">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth={1.8} />
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth={1.8} />
            <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
          </svg>
          Instagram
        </a>
        <a href="https://x.com/" target="_blank" rel="noreferrer" className="contact-link">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          Twitter
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Verify**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add src/types/model-viewer.d.ts src/components/marketing/RobotSection.tsx src/components/marketing/SnacksSection.tsx src/components/marketing/Testimonials.tsx src/components/marketing/Contact.tsx package.json package-lock.json
git commit -m "Add RobotSection, SnacksSection, Testimonials, Contact components"
```

---

## Task 14: Assemble HomePage

**Files:**
- Modify: `src/pages/HomePage.tsx` (replace WIP stub with the real composition)

**Interfaces:**
- Consumes: every component from Tasks 10-13, plus `useScrollToHash()` from Task 7.
- Produces: the complete `/` route matching the original `index.html` section order.

- [ ] **Step 1: Replace `src/pages/HomePage.tsx`**

```tsx
import { useScrollToHash } from '../hooks/useScrollToHash';
import { Hero } from '../components/marketing/Hero';
import { About } from '../components/marketing/About';
import { Features } from '../components/marketing/Features';
import { Plans } from '../components/marketing/Plans';
import { NeshSection } from '../components/marketing/NeshSection';
import { PomodoroTryout } from '../components/marketing/PomodoroTryout';
import { RobotSection } from '../components/marketing/RobotSection';
import { SnacksSection } from '../components/marketing/SnacksSection';
import { Testimonials } from '../components/marketing/Testimonials';
import { Contact } from '../components/marketing/Contact';

export function HomePage() {
  useScrollToHash();

  return (
    <>
      <Hero />
      <About />
      <Features />
      <Plans />
      <NeshSection />
      <PomodoroTryout />
      <RobotSection />
      <SnacksSection />
      <Testimonials />
      <Contact />
    </>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

Expected: exits 0. Then `npm run dev` and walk through `/` top to bottom: hero video autoplays, nav anchor links scroll to each section, "Get Started"/"Sign Up"/plan buttons open the signup modal, the Pomodoro try-it box generates and runs a schedule, the 3D robot viewer loads and is orbit-draggable, testimonials scroll with the arrow buttons.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "Assemble HomePage from marketing components"
```

---

## Task 15: Journey timeline components and JourneyPage

**Files:**
- Create: `src/data/journeyMilestones.ts`
- Create: `src/components/journey/TimelineItem.tsx`
- Create: `src/components/journey/TimelineProgressLine.tsx`
- Modify: `src/pages/JourneyPage.tsx` (replace WIP stub)

**Interfaces:**
- Produces: `JOURNEY_MILESTONES: JourneyMilestone[]`, `TimelineItem`, `TimelineProgressLine` — composed into the real `JourneyPage`.

Note: the source `journey.html` referenced `milestone-2.jpg`, `milestone-3.jpg`, `milestone-5.jpg`, `milestone-7.jpg`, and `milestone-6.jpg`, none of which exist in the `assets/journey/` folder — this is a pre-existing gap in the current site (those images already show broken on the live site today), not something introduced by this conversion, so those five references are kept as-is. Three other references (`milestone-cafe-2.jpg`, `milestone-cafe-3.jpg`, `milestone-wins-1.jpg`) are corrected below to match the actual files on disk (`milestone-cafe-2 (1).jpg`, `milestone-cafe-3 (1).jpg`, `milestone-wins-1 (1).jpg`), fixing three images that are currently broken.

- [ ] **Step 1: Create `src/data/journeyMilestones.ts`**

```ts
export interface JourneyMilestone {
  date: string;
  title: string;
  description: string;
  images: { src: string; alt: string }[];
}

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    date: 'Milestone 1',
    title: 'The idea',
    description: 'It started with a simple frustration, past papers scattered everywhere and no easy way to get help at 11pm before an exam. We sketched out what became Obscura on a whiteboard.',
    images: [
      { src: '/assets/journey/milestone-1-whiteboard.jpg', alt: 'Our original whiteboard sketch' },
      { src: '/assets/journey/milestone-1.jpg', alt: 'The Obscura team' },
    ],
  },
  {
    date: 'Milestone 2',
    title: 'First wireframes',
    description: 'Before writing a line of code, we mapped out every screen, chat, past papers, planner, timer, to make sure the whole experience actually made sense together.',
    images: [{ src: '/assets/journey/milestone-2.jpg', alt: 'Wireframes and planning' }],
  },
  {
    date: 'Milestone 3',
    title: "Building NESH's brain",
    description: 'We built the backend that lets NESH search real past papers and answer in context, RAG search, a FastAPI backend, and a lot of trial and error getting the answers to feel genuinely helpful.',
    images: [{ src: '/assets/journey/milestone-3.jpg', alt: 'Backend development' }],
  },
  {
    date: 'Milestone 4',
    title: 'Working sessions',
    description: 'Countless hours together figuring things out, one focused session at a time.',
    images: [
      { src: '/assets/journey/milestone-library-1.jpg', alt: 'Team working at the library' },
      { src: '/assets/journey/milestone-library-2.jpg', alt: 'Team working at the library' },
      { src: '/assets/journey/milestone-library-3.jpg', alt: 'Team working at the library' },
    ],
  },
  {
    date: 'Milestone 5',
    title: 'Writing the code',
    description: 'Line by line, things came together, plenty of debugging, plenty of "wait, why isn\'t this working" moments along the way.',
    images: [
      { src: '/assets/journey/milestone-code-1.jpg', alt: 'Writing the website code' },
      { src: '/assets/journey/milestone-code-2.jpg', alt: 'Writing the website code' },
      { src: '/assets/journey/milestone-code-3.jpg', alt: 'Writing the website code' },
    ],
  },
  {
    date: 'Milestone 6',
    title: 'Working together',
    description: 'Some of our best problem-solving happened side by side, laptops open, ideas flowing.',
    images: [
      { src: '/assets/journey/milestone-cafe-1.jpg', alt: 'Working at the cafe' },
      { src: '/assets/journey/milestone-cafe-2 (1).jpg', alt: 'Working at the cafe' },
      { src: '/assets/journey/milestone-cafe-3 (1).jpg', alt: 'Working at the cafe' },
    ],
  },
  {
    date: 'Milestone 7',
    title: '3D printing the shell',
    description: 'We designed and 3D printed our own enclosure for the NESH robot, ears, speaker grille, and a cutout for the screen, all from scratch and iterated by hand.',
    images: [{ src: '/assets/journey/milestone-3d-print.jpg', alt: '3D printed NESH robot shell prototype' }],
  },
  {
    date: 'Milestone 8',
    title: 'Getting the screen working',
    description: "The first big win on hardware, NESH's display actually running and responding, the moment this stopped being just a website and started being a real device.",
    images: [{ src: '/assets/journey/milestone-screen-demo.jpg', alt: 'NESH robot screen demo running' }],
  },
  {
    date: 'Milestone 9',
    title: 'Bringing it all together',
    description: 'Piecing together the website, the chat interface, the Pomodoro planner, and the sign-up flow into one cohesive product, this is where it started feeling real.',
    images: [{ src: '/assets/journey/milestone-5.jpg', alt: 'Full app coming together' }],
  },
  {
    date: 'Milestone 10',
    title: 'Spreading the word',
    description: 'Getting Obscura in front of people meant more than just code, we filmed our own ad, behind the scenes and all, to actually tell people this exists.',
    images: [{ src: '/assets/journey/milestone-7.jpg', alt: 'Filming the Obscura ad' }],
  },
  {
    date: 'Milestone 11',
    title: 'Small wins along the way',
    description: 'Every working feature felt like a reason to celebrate, this project has been as much about the people as the product.',
    images: [
      { src: '/assets/journey/milestone-wins-1 (1).jpg', alt: 'Team celebrating progress' },
      { src: '/assets/journey/milestone-wins-2.jpg', alt: 'Team celebrating progress' },
    ],
  },
  {
    date: 'Where we are now',
    title: 'Obscura today',
    description: 'Still building, still improving, and still just a group of students trying to make studying a little less stressful for everyone else. Thanks for following along.',
    images: [{ src: '/assets/journey/milestone-6.jpg', alt: 'Current state of Obscura' }],
  },
];
```

- [ ] **Step 2: Create `src/components/journey/TimelineItem.tsx`**

```tsx
import { useState } from 'react';
import type { JourneyMilestone } from '../../data/journeyMilestones';
import { useReveal } from '../../hooks/useReveal';

export function TimelineItem({ milestone }: { milestone: JourneyMilestone }) {
  const item = useReveal<HTMLDivElement>();
  const [index, setIndex] = useState(0);
  const total = milestone.images.length;

  function goTo(i: number) {
    setIndex(((i % total) + total) % total);
  }

  return (
    <div ref={item.ref} className={`${item.className} timeline-item`}>
      <div className="timeline-dot"></div>
      <div className="timeline-content">
        <span className="timeline-date">{milestone.date}</span>
        <h3>{milestone.title}</h3>
        <p>{milestone.description}</p>
        <div className={`timeline-gallery${total <= 1 ? ' single' : ''}`}>
          <div className="timeline-gallery-track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {milestone.images.map((img) => (
              <img key={img.src} src={img.src} alt={img.alt} />
            ))}
          </div>
          {total > 1 && (
            <>
              <button className="gallery-arrow prev" type="button" aria-label="Previous" onClick={() => goTo(index - 1)}>‹</button>
              <button className="gallery-arrow next" type="button" aria-label="Next" onClick={() => goTo(index + 1)}>›</button>
              <div className="gallery-counter"><span className="gallery-current">{index + 1}</span> / <span className="gallery-total">{total}</span></div>
              <div className="gallery-dots">
                {milestone.images.map((img, i) => (
                  <div key={img.src} className={`gallery-dot${i === index ? ' active' : ''}`} onClick={() => goTo(i)}></div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/journey/TimelineProgressLine.tsx`**

```tsx
import { useEffect, useState, type RefObject } from 'react';

export function TimelineProgressLine({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    function update() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.5;
      const scrolledPast = viewportCenter - rect.top;
      const next = Math.max(0, Math.min(1, scrolledPast / rect.height));
      setPercent(next);
    }
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [containerRef]);

  return (
    <>
      <div className="timeline-line-bg"></div>
      <div className="timeline-line-fill" style={{ height: `${percent * 100}%` }}></div>
    </>
  );
}
```

- [ ] **Step 4: Replace `src/pages/JourneyPage.tsx`**

```tsx
import { useRef } from 'react';
import { JOURNEY_MILESTONES } from '../data/journeyMilestones';
import { TimelineItem } from '../components/journey/TimelineItem';
import { TimelineProgressLine } from '../components/journey/TimelineProgressLine';
import { useReveal } from '../hooks/useReveal';

export function JourneyPage() {
  const label = useReveal<HTMLDivElement>();
  const title = useReveal<HTMLHeadingElement>();
  const sub = useReveal<HTMLParagraphElement>();
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <section className="journey-hero">
        <div ref={label.ref} className={label.className}>Our Journey</div>
        <h1 ref={title.ref} className={title.className}>Behind the scenes of Obscura</h1>
        <p ref={sub.ref} className={`${sub.className} section-sub`}>From a rough idea to a working AI study companion, here's the real, unfiltered story of how we built this, mistakes, late nights, and all.</p>
      </section>

      <section className="timeline-section">
        <div className="timeline" ref={timelineRef}>
          <TimelineProgressLine containerRef={timelineRef} />
          {JOURNEY_MILESTONES.map((milestone) => (
            <TimelineItem key={milestone.title} milestone={milestone} />
          ))}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npm run build
```

Expected: exits 0. Then `npm run dev`, visit `/journey`, confirm the progress line fills as you scroll and each multi-image milestone's gallery arrows/dots work.

- [ ] **Step 6: Commit**

```bash
git add src/data src/components/journey src/pages/JourneyPage.tsx
git commit -m "Add journey timeline components and assemble JourneyPage"
```

---

## Task 16: App shell Sidebar and real placeholder pages

**Files:**
- Create: `src/components/app-shell/Sidebar.tsx`
- Modify: `src/layouts/AppLayout.tsx` (render `Sidebar`)
- Modify: `src/pages/app/DashboardPage.tsx`, `src/pages/app/ChatPage.tsx`, `src/pages/app/PlannerPage.tsx`, `src/pages/app/FocusRoomPage.tsx`, `src/pages/app/ProgressPage.tsx` (replace WIP text with real placeholder content linking to `/legacy/*.html`)
- Create: `src/styles/app-shell.css` (sidebar/shell rules consolidated from the original per-page `<style>` blocks)
- Modify: `src/main.tsx` (import the new stylesheet)

**Interfaces:**
- Consumes: `useAuth()` (Sidebar's logout button).
- Produces: `Sidebar`, a real `AppLayout`, and five placeholder pages that look like part of the app rather than bare text.

Note: Progress is a real, working nav item (not "Soon") because the legacy `chat.html`/`dashboard.html`/`planner.html` already link to a working `progress.html` — Task 20 migrates that page to `/legacy/progress.html`. Profile stays "Soon" (unchanged from the original design).

- [ ] **Step 1: Create `src/styles/app-shell.css`**

Consolidate the shared sidebar/shell rules that were duplicated across `chat.html`, `dashboard.html`, `planner.html`, and `focus-room.html`'s inline `<style>` blocks (the `.app-shell`, `.app-sidebar`, `.app-nav-item`, `.app-nav-soon`, `.app-sidebar-footer`, `.app-main` rules — identical in all four originals):

```css
.app-shell { display: flex; min-height: 100vh; background: #F9F7FF; }
.app-sidebar {
  width: 240px; flex-shrink: 0; background: #ffffff;
  border-right: 1px solid rgba(124,92,191,0.1); padding: 24px 16px;
  display: flex; flex-direction: column;
}
.app-sidebar .logo { padding: 0 8px; margin-bottom: 32px; font-size: 18px; }
.app-sidebar .logo img { width: 36px; height: 36px; }
.app-nav-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border-radius: 12px; color: rgba(45,31,78,0.6); text-decoration: none;
  font-size: 14px; font-weight: 500; margin-bottom: 4px;
  transition: background 0.2s, color 0.2s;
}
.app-nav-item svg { width: 20px; height: 20px; flex-shrink: 0; }
.app-nav-item:hover { background: rgba(124,92,191,0.06); }
.app-nav-item.active { background: rgba(124,92,191,0.1); color: #7C5CBF; font-weight: 600; }
.app-nav-soon {
  margin-left: auto; font-size: 10px; font-weight: 700; color: rgba(124,92,191,0.5);
  background: rgba(124,92,191,0.08); padding: 2px 6px; border-radius: 100px;
}
.app-sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(124,92,191,0.1); }
.app-main { flex: 1; padding: 40px 48px; max-width: 1000px; }
.app-placeholder-card {
  background: #ffffff; border: 1px solid rgba(124,92,191,0.1); border-radius: 16px;
  padding: 32px; max-width: 480px;
}
.app-placeholder-card h2 { font-family: 'Space Grotesk', sans-serif; color: #2D1F4E; margin-bottom: 8px; }
.app-placeholder-card p { color: rgba(45,31,78,0.6); font-size: 14px; line-height: 1.6; }
.app-placeholder-card a { color: #7C5CBF; font-weight: 600; }

@media (max-width: 900px) {
  .app-shell { flex-direction: column; }
  .app-sidebar {
    width: 100%; flex-direction: row; overflow-x: auto; padding: 12px;
    border-right: none; border-bottom: 1px solid rgba(124,92,191,0.1);
  }
  .app-sidebar .logo { display: none; }
  .app-nav-item { flex-shrink: 0; }
  .app-nav-soon { display: none; }
  .app-sidebar-footer { display: none; }
  .app-main { padding: 24px; }
}
```

- [ ] **Step 2: Import it in `src/main.tsx`**

Add below the existing `import './style.css';`:

```tsx
import './styles/app-shell.css';
```

- [ ] **Step 3: Create `src/components/app-shell/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/app/dashboard',
    label: 'Home',
    path: 'M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9',
  },
  {
    to: '/app/focus-room',
    label: 'Focus Room',
    path: 'M12 8v4l3 2M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  },
  {
    to: '/app/chat',
    label: 'AI Chat',
    path: 'M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z',
  },
  {
    to: '/app/planner',
    label: 'Planner',
    path: 'M4 5h16v15H4z M4 9.5h16 M8 3v3.2M16 3v3.2',
  },
  {
    to: '/app/progress',
    label: 'Progress',
    path: 'M5 19V10M12 19V5M19 19v-7',
  },
];

export function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="app-sidebar">
      <NavLink to="/app/dashboard" className="logo">
        <img src="/assets/logo.png" alt="Obscura logo" />
      </NavLink>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `app-nav-item${isActive ? ' active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={item.path} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {item.label}
        </NavLink>
      ))}

      <span className="app-nav-item">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth={1.8} /><path d="M5 20c1.5-4 5-5.5 7-5.5S17.5 16 19 20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" /></svg>
        Profile
        <span className="app-nav-soon">Soon</span>
      </span>

      <div className="app-sidebar-footer">
        <button
          type="button"
          className="app-nav-item"
          onClick={() => signOut()}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
          Log Out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Update `src/layouts/AppLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/app-shell/Sidebar';

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Replace the five placeholder pages**

`src/pages/app/DashboardPage.tsx`:
```tsx
export function DashboardPage() {
  return (
    <div className="app-placeholder-card">
      <h2>Dashboard</h2>
      <p>
        This page is coming in the next phase. In the meantime, the original working
        version is still live at <a href="/legacy/dashboard.html">/legacy/dashboard.html</a>.
      </p>
    </div>
  );
}
```

`src/pages/app/ChatPage.tsx`:
```tsx
export function ChatPage() {
  return (
    <div className="app-placeholder-card">
      <h2>AI Chat</h2>
      <p>
        This page is coming in the next phase. In the meantime, the original working
        version is still live at <a href="/legacy/chat.html">/legacy/chat.html</a>.
      </p>
    </div>
  );
}
```

`src/pages/app/PlannerPage.tsx`:
```tsx
export function PlannerPage() {
  return (
    <div className="app-placeholder-card">
      <h2>Study Planner</h2>
      <p>
        This page is coming in the next phase. In the meantime, the original working
        version is still live at <a href="/legacy/planner.html">/legacy/planner.html</a>.
      </p>
    </div>
  );
}
```

`src/pages/app/FocusRoomPage.tsx`:
```tsx
export function FocusRoomPage() {
  return (
    <div className="app-placeholder-card">
      <h2>Focus Room</h2>
      <p>
        This page is coming in the next phase. In the meantime, the original working
        version is still live at <a href="/legacy/focus-room.html">/legacy/focus-room.html</a>.
      </p>
    </div>
  );
}
```

`src/pages/app/ProgressPage.tsx`:
```tsx
export function ProgressPage() {
  return (
    <div className="app-placeholder-card">
      <h2>Progress</h2>
      <p>
        This page is coming in the next phase. In the meantime, the original working
        version is still live at <a href="/legacy/progress.html">/legacy/progress.html</a>.
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npm run build
```

Expected: exits 0. Then `npm run dev`, log in (or sign up), complete onboarding once Task 17 exists, and confirm `/app/dashboard`, `/app/chat`, `/app/planner`, `/app/focus-room`, `/app/progress` all show the sidebar shell with the correct active nav item and a working link to their `/legacy/*.html` counterpart. Confirm "Log Out" clears the session and redirects to `/`.

- [ ] **Step 7: Commit**

```bash
git add src/components/app-shell src/layouts/AppLayout.tsx src/pages/app src/styles/app-shell.css src/main.tsx
git commit -m "Add app shell Sidebar and real placeholder pages"
```

---

## Task 17: OnboardingPage (4-step wizard)

**Files:**
- Modify: `src/pages/OnboardingPage.tsx` (replace WIP stub)

**Interfaces:**
- Consumes: `useAuth()` (`session`, `refreshProfile`), `supabase`, `StudentProfile` from `src/types/profile.ts`.
- Produces: the real `/onboarding` route, matching the original 4-step wizard (O/L students skip the "stream" step).

- [ ] **Step 1: Replace `src/pages/OnboardingPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { StudentProfile } from '../types/profile';

type ExamType = 'OL' | 'AL';
type Syllabus = 'local' | 'edexcel' | 'cambridge';
type Stream = 'science' | 'commerce' | 'arts' | 'technology';
type Medium = 'english' | 'sinhala' | 'tamil';

interface Answers {
  exam_type: ExamType | null;
  syllabus: Syllabus | null;
  stream: Stream | null;
  medium: Medium | null;
}

function getStepOrder(examType: ExamType | null): number[] {
  return examType === 'OL' ? [1, 2, 4] : [1, 2, 3, 4];
}

export function OnboardingPage() {
  const { session, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Answers>({ exam_type: null, syllabus: null, stream: null, medium: null });
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const order = getStepOrder(answers.exam_type);
  const currentIndex = order.indexOf(currentStep);

  function select<K extends keyof Answers>(field: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }

  function goNext() {
    const idx = order.indexOf(currentStep);
    setCurrentStep(order[idx + 1]);
  }

  function goBack() {
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  }

  async function handleFinish(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError('');
    try {
      const payload: StudentProfile = {
        id: session.user.id,
        exam_type: answers.exam_type as ExamType,
        syllabus: answers.syllabus as Syllabus,
        stream: answers.exam_type === 'OL' ? null : (answers.stream as Stream),
        medium: answers.medium as Medium,
      };
      const { error: insertError } = await supabase.from('student_profiles').insert(payload);
      if (insertError) throw new Error(insertError.message);
      await refreshProfile();
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving your profile.');
      setSaving(false);
    }
  }

  const dotDone = (dotIndex: number) => dotIndex < currentIndex + 1 || (currentStep === order[order.length - 1] && dotIndex === 3);

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <img src="/assets/logo.png" alt="Obscura logo" />
          OBSCURA
        </div>

        <div className="onboarding-steps">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={dotDone(i) ? 'done' : ''}></span>
          ))}
        </div>

        {error && <div className="onboarding-error visible">{error}</div>}

        {currentStep === 1 && (
          <div className="onboarding-step active">
            <h2>Which exam are you preparing for?</h2>
            <p className="sub">This helps NESH tailor everything to your syllabus.</p>
            <div className="option-grid">
              {(['OL', 'AL'] as ExamType[]).map((value) => (
                <div
                  key={value}
                  className={`option-card${answers.exam_type === value ? ' selected' : ''}`}
                  onClick={() => select('exam_type', value)}
                >
                  {value === 'OL' ? 'O/L' : 'A/L'}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" disabled>Back</button>
              <button className="btn-primary onboarding-continue" disabled={!answers.exam_type} onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="onboarding-step active">
            <h2>Which syllabus do you follow?</h2>
            <p className="sub">So NESH pulls answers from the right past papers.</p>
            <div className="option-grid">
              {([['local', 'Local'], ['edexcel', 'Edexcel'], ['cambridge', 'Cambridge']] as [Syllabus, string][]).map(([value, text]) => (
                <div
                  key={value}
                  className={`option-card${answers.syllabus === value ? ' selected' : ''}`}
                  onClick={() => select('syllabus', value)}
                >
                  {text}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back visible" onClick={goBack}>Back</button>
              <button className="btn-primary onboarding-continue" disabled={!answers.syllabus} onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="onboarding-step active">
            <h2>What's your stream?</h2>
            <p className="sub">Pick the A/L stream you're studying.</p>
            <div className="option-grid">
              {([['science', 'Science'], ['commerce', 'Commerce'], ['arts', 'Arts'], ['technology', 'Technology']] as [Stream, string][]).map(([value, text]) => (
                <div
                  key={value}
                  className={`option-card${answers.stream === value ? ' selected' : ''}`}
                  onClick={() => select('stream', value)}
                >
                  {text}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back visible" onClick={goBack}>Back</button>
              <button className="btn-primary onboarding-continue" disabled={!answers.stream} onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <form className="onboarding-step active" onSubmit={handleFinish}>
            <h2>What's your preferred medium?</h2>
            <p className="sub">NESH can explain things in whichever language is easiest for you.</p>
            <div className="option-grid">
              {([['english', 'English'], ['sinhala', 'Sinhala'], ['tamil', 'Tamil']] as [Medium, string][]).map(([value, text]) => (
                <div
                  key={value}
                  className={`option-card${answers.medium === value ? ' selected' : ''}`}
                  onClick={() => select('medium', value)}
                >
                  {text}
                </div>
              ))}
            </div>
            <div className="onboarding-nav">
              <button type="button" className="onboarding-back visible" onClick={goBack}>Back</button>
              <button type="submit" className="btn-primary onboarding-continue" disabled={!answers.medium || saving}>
                {saving ? 'Saving...' : 'Finish'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

Expected: exits 0. Then `npm run dev`: sign up a fresh test account, confirm redirect to `/onboarding`, step through all 4 steps (verify O/L skips the stream step, A/L includes it), submit, and confirm redirect to `/app/dashboard` with the new profile visible (e.g. by checking Supabase's `student_profiles` table).

- [ ] **Step 3: Commit**

```bash
git add src/pages/OnboardingPage.tsx
git commit -m "Implement OnboardingPage 4-step wizard"
```

---

## Task 18: Chat API types and client (not wired to a page yet)

**Files:**
- Create: `src/types/chat.ts`
- Create: `src/lib/api/chat.ts`

**Interfaces:**
- Produces: `ChatRequest`, `ChatResponse`, `ChatSource`, `ChatHistoryMessage` types matching the documented `/chat/ask` contract, and `askNesh(request: ChatRequest): Promise<ChatResponse>`. Not called from any component this phase — ready for the phase-2 Chat page to import.

- [ ] **Step 1: Create `src/types/chat.ts`**

```ts
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  question: string;
  stream: string;
  subject: string;
  syllabus: string;
  medium: string;
  student_id: string;
  chat_history: ChatHistoryMessage[];
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

- [ ] **Step 2: Create `src/lib/api/chat.ts`**

```ts
import type { ChatRequest, ChatResponse } from '../../types/chat';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function askNesh(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "NESH couldn't answer that just now.");
  }

  return res.json() as Promise<ChatResponse>;
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/types/chat.ts src/lib/api/chat.ts
git commit -m "Add typed chat API client for the future /chat/ask integration"
```

---

## Task 19: ErrorBoundary and final cleanup

**Files:**
- Create: `src/components/common/ErrorBoundary.tsx`
- Modify: `src/main.tsx` (wrap the router in the boundary)

**Interfaces:**
- Consumes: nothing external.
- Produces: a top-level crash guard; the final `main.tsx` composition.

- [ ] **Step 1: Create `src/components/common/ErrorBoundary.tsx`**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in Obscura app:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Something went wrong.</h1>
          <p>Please refresh the page. If this keeps happening, let us know at obscurabytechlume@gmail.com.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Finalize `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { router } from './router';
import './style.css';
import './styles/app-shell.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
```

- [ ] **Step 3: Full-project verification**

```bash
npm run build
```

Expected: exits 0, no TypeScript errors, no unused-import warnings.

Then `npm run dev` and walk the complete flow end to end:
1. `/` — full marketing page, all sections render, nav anchors scroll correctly.
2. `/journey` — timeline renders with working galleries and scroll-fill line.
3. Sign up a new account via the nav CTA → redirected through `/onboarding` → `/app/dashboard`.
4. Sidebar navigation across all five `/app/*` placeholder pages (dashboard, chat, planner, focus-room, progress), each linking correctly to its `/legacy/*.html` counterpart.
5. `/legacy/chat.html`, `/legacy/dashboard.html`, `/legacy/planner.html`, `/legacy/focus-room.html`, `/legacy/progress.html` load directly and still fully work (existing Supabase-backed functionality untouched), and their sidebars cross-link to each other correctly including Progress.
6. Log out from the sidebar redirects to `/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/ErrorBoundary.tsx src/main.tsx
git commit -m "Add top-level ErrorBoundary and finalize app composition"
```

---

## Task 20: Migrate progress.html to /legacy and sync Progress nav across all legacy pages

**Context:** This task was added mid-conversion. After Task 3 ran, a `progress.html` page (stat cards, 7-day activity chart, recently-completed list, all driven by `study_tasks` via the same direct-Supabase-fetch pattern as the other app pages) was added at the repo root on `main`, along with edits enabling the Progress nav link (removing the `app-nav-soon` "Soon" badge) in `chat.html`, `dashboard.html`, and `planner.html`. `focus-room.html` was not edited and still shows "Soon" for Progress. These changes were made directly on `main`, not in this worktree, and are now committed there (commit `7d6aba4`, "Add progress.html page and enable Progress nav link") — but they predate Task 3's move of the four app pages into `public/legacy/`, so they reference the OLD root-level paths and need the same link-fixing treatment Task 3 applied, applied fresh to `progress.html` and retrofitted into the four already-migrated `public/legacy/*.html` files in this worktree.

**Files:**
- Create: `public/legacy/progress.html` (migrated from the root `progress.html` on `main`, commit `7d6aba4`)
- Modify: `public/legacy/chat.html`, `public/legacy/dashboard.html`, `public/legacy/planner.html` (sync the Progress nav link — same edit `main` already has, applied at the new `/legacy/` paths)
- Modify: `public/legacy/focus-room.html` (add the Progress nav link for consistency — `main` never got this edit, but the sidebar is otherwise identical across all five pages, so this closes the gap)

**Interfaces:**
- Consumes: nothing new — same Supabase REST/localStorage-session pattern as the other four legacy pages.
- Produces: a fifth working legacy page at `/legacy/progress.html`, and a Progress nav link that works identically (points at `/legacy/progress.html`) from all five legacy pages' sidebars.

- [ ] **Step 1: Fetch `progress.html`'s content as committed on `main`**

```bash
git show main:progress.html > /tmp/progress-source.html
```

(Or read it directly from the main checkout at `C:\Users\Dell\StudioProjects\obscura-website\progress.html` — same content, commit `7d6aba4`.)

- [ ] **Step 2: Create `public/legacy/progress.html` with the link-fixing treatment applied**

Take the content from Step 1 and apply the same categories of replacement Task 3 applied to the other four pages:

| old | new | replace_all |
|---|---|---|
| `href="style.css"` | `href="/legacy/style.css"` | no |
| `src="assets/logo.png"` | `src="/assets/logo.png"` | no |
| `href="dashboard.html"` | `href="/legacy/dashboard.html"` | yes |
| `href="chat.html"` | `href="/legacy/chat.html"` | no |
| `href="planner.html"` | `href="/legacy/planner.html"` | no |
| `href="focus-room.html"` | `href="/legacy/focus-room.html"` | no |
| `href="progress.html" class="app-nav-item active"` | `href="/legacy/progress.html" class="app-nav-item active"` | no |
| `window.location.href = 'index.html';` | `window.location.href = '/';` | yes |

Before applying, re-check actual occurrence counts against the fetched content the way Task 3's implementer did — the table above states intent (all occurrences of a given path should point to the same destination), not a verified count; use `replace_all: true` for any string that turns out to occur more than once, same as Task 3's implementer correctly did for two cases the original brief undercounted.

- [ ] **Step 3: Sync the Progress nav link into the three already-migrated pages**

In `public/legacy/chat.html`, `public/legacy/dashboard.html`, and `public/legacy/planner.html`, find the sidebar's Progress nav item, currently:

```html
<a href="#" class="app-nav-item">
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 19V10M12 19V5M19 19v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
  Progress
  <span class="app-nav-soon">Soon</span>
</a>
```

Replace with:

```html
<a href="/legacy/progress.html" class="app-nav-item">
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 19V10M12 19V5M19 19v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
  Progress
</a>
```

- [ ] **Step 4: Apply the same edit to `public/legacy/focus-room.html` for consistency**

`focus-room.html`'s sidebar markup is different from the other four (it's a themed full-screen page, not the shared `app-shell`/`app-sidebar` pattern) — check whether it has an equivalent Progress nav reference at all. If it does not have a sidebar/nav section in the same style, no change is needed there; note this in your report rather than inventing a nav element that doesn't fit the page's actual layout. If it does have one matching the pattern above, apply the same replacement.

- [ ] **Step 5: Verify no stale references remain**

```bash
grep -rn 'href="style.css"\|href="dashboard.html"\|href="chat.html"\|href="planner.html"\|href="focus-room.html"\|href="progress.html"\|href="index.html"\|src="assets/' public/legacy/*.html
```

Expected: no output.

- [ ] **Step 6: Verify**

```bash
npm run build
```

Expected: exits 0 (this task only touches static files under `public/`, so the build should be unaffected — this just confirms nothing else broke).

- [ ] **Step 7: Commit**

```bash
git add public/legacy/progress.html public/legacy/chat.html public/legacy/dashboard.html public/legacy/planner.html public/legacy/focus-room.html
git commit -m "Migrate progress.html to /legacy and sync Progress nav across legacy pages"
```

