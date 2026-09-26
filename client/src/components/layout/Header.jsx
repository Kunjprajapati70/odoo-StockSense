import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dashboardService } from '../../services/inventoryService';
import { NAV_SECTIONS } from '../../constants/navigation';
import { ROUTES } from '../../constants/routes';
import { roleLabel } from '../../utils/format';

const DETAIL_TITLES = [
  ['/products/', 'Inventory', 'Product'],
  ['/receipts/', 'Operations', 'Receipt'],
  ['/deliveries/', 'Operations', 'Delivery order'],
  ['/transfers/', 'Operations', 'Internal transfer'],
  ['/adjustments/', 'Operations', 'Adjustment'],
];

function pageMeta(pathname) {
  const detail = DETAIL_TITLES.find(([prefix]) => pathname.startsWith(prefix) && pathname !== prefix.slice(0, -1));
  if (detail) return { section: detail[1], title: detail[2] };
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((entry) => entry.to === pathname);
    if (item) return { section: section.label, title: item.label };
  }
  return { section: 'StockSense', title: 'Inventory' };
}

export default function Header({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(0);
  const [query, setQuery] = useState('');
  const meta = pageMeta(location.pathname);

  useEffect(() => {
    dashboardService.alerts()
      .then((response) => {
        const data = response.data;
        setAlerts((data.lowStock?.length || 0) + (data.outOfStock?.length || 0));
      })
      .catch(() => setAlerts(0));
  }, [location.pathname]);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  function onSearch(event) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `${ROUTES.PRODUCTS}?search=${encodeURIComponent(term)}` : ROUTES.PRODUCTS);
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button className="menu-btn" type="button" onClick={onMenu} aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <div className="topbar-title">
          <span className="crumb">{meta.section}</span>
          <strong>{meta.title}</strong>
        </div>
      </div>
      <form className="global-search" onSubmit={onSearch}>
        <Search size={16} aria-hidden="true" />
        <input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or SKU" />
        <kbd className="search-kbd">Ctrl K</kbd>
      </form>
      <div className="topbar-actions">
        <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link className="icon-btn alert-bell" to={ROUTES.ALERTS} aria-label={`Alerts, ${alerts} open`}>
          <Bell size={18} />
          {alerts > 0 ? <span className="alert-badge">{alerts > 99 ? '99+' : alerts}</span> : null}
        </Link>
        <div className="menu">
          <button className="user-btn" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            <span className="user-avatar">{initial}</span>
            <span className="user-name">{user?.name || 'Account'}</span>
            <span className="role-badge">{roleLabel(user?.role)}</span>
          </button>
          {open ? (
            <div className="menu-list">
              <Link to={ROUTES.PROFILE} onClick={() => setOpen(false)}>
                <User size={16} /> Profile
              </Link>
              <Link to={ROUTES.SETTINGS} onClick={() => setOpen(false)}>
                <Settings size={16} /> Settings
              </Link>
              <button type="button" onClick={logout}>
                <LogOut size={16} /> Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
