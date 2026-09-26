import { Outlet } from 'react-router-dom';

/**
 * Public auth screens will redirect signed-in users from here.
 * Until authentication is implemented, matched routes render so the shell can be reviewed.
 */
export default function PublicRoute() {
  return <Outlet />;
}
