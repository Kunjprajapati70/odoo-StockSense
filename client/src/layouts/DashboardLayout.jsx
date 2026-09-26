import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CommandSearch from '../components/common/CommandSearch';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('stocksense_nav') === 'collapsed');

  function toggleNav() {
    setCollapsed((current) => {
      localStorage.setItem('stocksense_nav', current ? 'expanded' : 'collapsed');
      return !current;
    });
  }

  return (
    <div className={`app-shell${collapsed ? ' nav-collapsed' : ''}${user?.preferences?.compactTables ? ' compact' : ''}`}>
      <Sidebar open={open} collapsed={collapsed} onToggle={toggleNav} onNavigate={() => setOpen(false)} />
      {open ? <button className="overlay" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}
      <div className="workspace">
        <Header onMenu={() => setOpen(true)} />
        <CommandSearch />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
