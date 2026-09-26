import { Outlet } from 'react-router-dom';

/**
 * Authenticated routes will check the session here.
 * Until authentication is implemented, matched routes render so the shell can be reviewed.
 */
export default function ProtectedRoute() {
  return <Outlet />;
}
