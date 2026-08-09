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
    if (profileLoading && !profile) {
      return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;
    }
    if (!profileLoading && !profile) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <Outlet />;
}
