import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { errorMessage } from '../../services/api';
import { ROUTES } from '../../constants/routes';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState(location.state?.resetToken ? '' : 'Request a new verification code before choosing a password.');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authService.resetPassword({ ...form, resetToken: location.state?.resetToken });
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-grid">
      <div className="field wide"><label htmlFor="new-password">New password</label><input id="new-password" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
      <div className="field wide"><label htmlFor="confirm-new">Confirm password</label><input id="confirm-new" type="password" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></div>
      {error ? <p className="form-error wide">{error}</p> : null}
      <button className="btn btn-primary wide" type="submit" disabled={busy || !location.state?.resetToken}>{busy ? 'Saving…' : 'Update password'}</button>
    </form>
  );
}
