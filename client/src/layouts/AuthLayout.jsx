import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="auth-brand">StockSense</p>
        <Outlet />
        <p className="auth-links">
          <Link to={ROUTES.DASHBOARD}>Go to workspace</Link>
        </p>
      </div>
    </div>
  );
}
