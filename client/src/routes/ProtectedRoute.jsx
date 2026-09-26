import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { TableSkeleton } from '../components/common/States';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <TableSkeleton />;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
