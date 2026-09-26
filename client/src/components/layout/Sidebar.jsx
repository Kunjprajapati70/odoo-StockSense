import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '../../constants/navigation';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>StockSense</strong>
        <span>Inventory</span>
      </div>
      <nav>
        {NAV_SECTIONS.map((section) => (
          <div className="nav-section" key={section.label}>
            <p className="nav-label">{section.label}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
