import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="workspace">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
