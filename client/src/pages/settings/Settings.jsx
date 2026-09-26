import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Warehouse } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import { errorMessage } from '../../services/api';
import { ROUTES } from '../../constants/routes';

export default function Settings() {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [form, setForm] = useState(user.preferences || { emailAlerts: true, compactTables: false });

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await authService.updateSettings(form);
      setUser(response.data);
      toast.notify('Settings saved.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>Settings</h1><p>Account preferences and warehouse setup.</p></div></header>
      <section className="card card-pad" style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <h2>Warehouses</h2>
        <p className="muted">Manage warehouses and the locations used for receipts, deliveries, and transfers.</p>
        <Link className="btn btn-primary" to={ROUTES.WAREHOUSE} style={{ justifySelf: 'start' }}>
          <Warehouse size={16} /> Open warehouses
        </Link>
      </section>
      <section className="card card-pad" style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <h2>Appearance</h2>
        <p className="muted">Choose your preferred workspace visual theme.</p>
        <div className="theme-switch">
          <button className="btn" type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
            <Sun size={16} /> Light
          </button>
          <button className="btn" type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
            <Moon size={16} /> Dark
          </button>
        </div>
      </section>
      <form className="card card-pad" onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label><input type="checkbox" checked={form.emailAlerts} onChange={(event) => setForm({ ...form, emailAlerts: event.target.checked })} /> Email me about low-stock alerts</label>
        <label><input type="checkbox" checked={form.compactTables} onChange={(event) => setForm({ ...form, compactTables: event.target.checked })} /> Use compact tables</label>
        <button className="btn btn-primary" type="submit">Save settings</button>
      </form>
    </section>
  );
}
