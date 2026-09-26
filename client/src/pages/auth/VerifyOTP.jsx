import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { errorMessage } from '../../services/api';
import { ROUTES } from '../../constants/routes';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await authService.verifyOtp({ email, otp });
      navigate(ROUTES.RESET_PASSWORD, { state: { resetToken: response.data.resetToken } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-grid">
      <p className="muted wide">{location.state?.message || 'Enter the 6-digit code for this account.'}</p>
      <div className="field wide"><label htmlFor="otp-email">Email</label><input id="otp-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <div className="field wide"><label htmlFor="otp">Verification code</label><input id="otp" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} /></div>
      {error ? <p className="form-error wide">{error}</p> : null}
      <button className="btn btn-primary wide" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Verify code'}</button>
    </form>
  );
}
