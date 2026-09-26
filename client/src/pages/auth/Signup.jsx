import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../services/api';
import { ROUTES } from '../../constants/routes';

const EMPTY = { name: '', email: '', password: '', confirmPassword: '' };

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signup(form);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-grid">
      <div className="field wide"><label htmlFor="name">Full name</label><input id="name" name="name" required value={form.name} onChange={update} /></div>
      <div className="field wide"><label htmlFor="signup-email">Email</label><input id="signup-email" name="email" type="email" required value={form.email} onChange={update} /></div>
      <div className="field"><label htmlFor="signup-password">Password</label><input id="signup-password" name="password" type="password" required value={form.password} onChange={update} /></div>
      <div className="field"><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" required value={form.confirmPassword} onChange={update} /></div>
      <p className="muted wide">Use at least 8 characters with upper, lower, and a number. New accounts join as warehouse staff.</p>
      {error ? <p className="form-error wide">{error}</p> : null}
      <button className="btn btn-primary wide" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
  );
}
