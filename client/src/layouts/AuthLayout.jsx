import { Link, Outlet } from 'react-router-dom';
import { Boxes, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ROUTES } from '../constants/routes';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="auth-shell">
      <button className="icon-btn theme-float" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <aside className="auth-aside">
        <div className="auth-mark">
          <div className="auth-mark-box" aria-hidden="true">
            <Boxes size={20} color="#ffffff" strokeWidth={2.4} />
          </div>
          <span>StockSense</span>
        </div>
        <h2>A clear, real-time record of every unit in stock.</h2>
        <div className="auth-features">
          <div className="auth-feature-pill">
            <span className="auth-feature-dot" aria-hidden="true" />
            <span>Automated multi-warehouse receipts & deliveries</span>
          </div>
          <div className="auth-feature-pill">
            <span className="auth-feature-dot" aria-hidden="true" />
            <span>Immutable double-entry stock movement ledger</span>
          </div>
          <div className="auth-feature-pill">
            <span className="auth-feature-dot" aria-hidden="true" />
            <span>Dynamic reordering & predictive low-stock alerts</span>
          </div>
        </div>
      </aside>
      <div className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-heading">
            <p>Welcome to StockSense</p>
            <h1>Inventory Workspace</h1>
          </div>
          <Outlet />
          <p className="auth-links">
            <Link to={ROUTES.LOGIN}>Log in</Link>
            <Link to={ROUTES.SIGNUP}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
