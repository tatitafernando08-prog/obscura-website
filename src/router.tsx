import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MarketingLayout } from './layouts/MarketingLayout';
import { HomePage } from './pages/HomePage';
import { JourneyPage } from './pages/JourneyPage';
import { DownloadPage } from './pages/DownloadPage';
import { ProtectedRoute } from './components/routing/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/journey', element: <JourneyPage /> },
      { path: '/download', element: <DownloadPage /> },
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
      { path: 'focus-room', lazy: () => import('./pages/app/FocusRoomPage').then((m) => ({ Component: m.FocusRoomPage })) },
      {
        lazy: () => import('./layouts/AppLayout').then((m) => ({ Component: m.AppLayout })),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', lazy: () => import('./pages/app/DashboardPage').then((m) => ({ Component: m.DashboardPage })) },
          { path: 'chat', lazy: () => import('./pages/app/ChatPage').then((m) => ({ Component: m.ChatPage })) },
          { path: 'papers', lazy: () => import('./pages/app/PastPapersPage').then((m) => ({ Component: m.PastPapersPage })) },
          { path: 'papers/:id', lazy: () => import('./pages/app/PastPaperDetailPage').then((m) => ({ Component: m.PastPaperDetailPage })) },
          { path: 'planner', lazy: () => import('./pages/app/PlannerPage').then((m) => ({ Component: m.PlannerPage })) },
          { path: 'flashcards', lazy: () => import('./pages/app/FlashcardsPage').then((m) => ({ Component: m.FlashcardsPage })) },
          { path: 'flashcards/study', lazy: () => import('./pages/app/StudySessionPage').then((m) => ({ Component: m.StudySessionPage })) },
          { path: 'flashcards/:deckId', lazy: () => import('./pages/app/DeckPage').then((m) => ({ Component: m.DeckPage })) },
          { path: 'progress', lazy: () => import('./pages/app/ProgressPage').then((m) => ({ Component: m.ProgressPage })) },
          { path: 'settings', lazy: () => import('./pages/app/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
