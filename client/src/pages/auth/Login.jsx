import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../services/api';
import { ROUTES } from '../../constants/routes';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(params.get('expired') ? 'Your session has expired. Please log in again.' : '');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function fillDemo(email) {
    setForm({ email, password: 'StockSense#2026' });
    setError('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required value={form.email} onChange={update} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={update} />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
      <div className="demo-panel">
        <div>
          <strong>Demo accounts</strong>
          <p>Choose a role to fill the email and password. Press Log in to continue.</p>
        </div>
        <div className="demo-grid">
          <button className="demo-btn" type="button" onClick={() => fillDemo('manager@stocksense.demo')}>
            <span>Inventory Manager</span>
            <small>manager@stocksense.demo</small>
          </button>
          <button className="demo-btn" type="button" onClick={() => fillDemo('staff@stocksense.demo')}>
            <span>Warehouse Staff</span>
            <small>staff@stocksense.demo</small>
          </button>
        </div>
      </div>
      <Link className="auth-forgot" to={ROUTES.FORGOT_PASSWORD}>Forgot password</Link>
    </form>
  );
}
