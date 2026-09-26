import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { errorMessage } from '../../services/api';
import { ROUTES } from '../../constants/routes';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await authService.forgotPassword({ email });
      navigate(ROUTES.VERIFY_OTP, { state: { email, message: response.message } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-grid">
      <p className="muted wide">Enter the email on the account. We will send a 6-digit code that expires in 10 minutes.</p>
      <div className="field wide">
        <label htmlFor="reset-email">Email</label>
        <input id="reset-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      {error ? <p className="form-error wide">{error}</p> : null}
      <button className="btn btn-primary wide" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send verification code'}</button>
    </form>
  );
}
