import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

export default function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <Outlet />;
}
