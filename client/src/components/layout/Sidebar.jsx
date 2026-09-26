import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Boxes, LogOut, PanelLeft } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';

export default function Sidebar({ open, collapsed, onToggle, onNavigate }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const main = NAV_SECTIONS.filter((section) => section.label !== 'Profile');
  const account = NAV_SECTIONS.find((section) => section.label === 'Profile');

  async function onLogout() {
    await logout();
    onNavigate?.();
    navigate(ROUTES.LOGIN);
  }

  function renderItem(item) {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        data-label={item.label}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        onClick={onNavigate}
      >
        <Icon size={18} aria-hidden="true" />
        <span className="nav-text">{item.label}</span>
      </NavLink>
    );
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={onNavigate}>×</button>
      <div className="brand">
        <div className="brand-badge" aria-hidden="true">
          <Boxes size={18} strokeWidth={2.2} />
        </div>
        <div className="brand-text">
          <strong>StockSense</strong>
          <span>Inventory</span>
        </div>
        <button className="nav-collapse" type="button" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <PanelLeft size={16} />
        </button>
      </div>
      <nav>
        {main.map((section) => (
          <div key={section.label}>
            <p className="nav-label">{section.label}</p>
            {section.items.map(renderItem)}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <Link className="sidebar-note" to="/alerts" onClick={onNavigate} title="Stock watch">
          <strong>Stock watch</strong>
          <span>Low and out-of-stock items that need a reorder.</span>
        </Link>
        <p className="nav-label">Profile</p>
        {account?.items.map(renderItem)}
        <button className="nav-link" type="button" data-label="Log out" title={collapsed ? 'Log out' : undefined} onClick={onLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span className="nav-text">Log out</span>
        </button>
      </div>
    </aside>
  );
}
