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
