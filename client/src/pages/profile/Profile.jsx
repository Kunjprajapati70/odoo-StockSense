import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import { errorMessage } from '../../services/api';
import { formatDate, roleLabel } from '../../utils/format';
import { ROUTES } from '../../constants/routes';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  async function onProfile(event) {
    event.preventDefault();
    try {
      const response = await authService.updateProfile({ name });
      setUser(response.data);
      toast.notify('Profile updated successfully.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function onPassword(event) {
    event.preventDefault();
    try {
      const response = await authService.updatePassword(passwords);
      toast.notify(response.message);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function onLogout() {
    await logout();
    navigate(ROUTES.LOGIN);
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>Profile</h1><p>Account details for the signed-in user.</p></div><button className="btn" type="button" onClick={onLogout}>Log out</button></header>
      <div className="split">
        <article className="card card-pad">
          <h2>Account</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {roleLabel(user.role)}</p>
          <p><strong>Status:</strong> {user.status}</p>
          <p><strong>Created:</strong> {formatDate(user.createdAt)}</p>
          <form className="form-grid" onSubmit={onProfile} style={{ marginTop: 16 }}>
            <div className="field wide"><label htmlFor="profile-name">Full name</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
            <button className="btn btn-primary" type="submit">Save profile</button>
          </form>
        </article>
        <article className="card card-pad">
          <h2>Change password</h2>
          <form className="form-grid" onSubmit={onPassword}>
            <div className="field wide"><label htmlFor="current">Current password</label><input id="current" type="password" required value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} /></div>
            <div className="field wide"><label htmlFor="next">New password</label><input id="next" type="password" required value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} /></div>
            <div className="field wide"><label htmlFor="confirm">Confirm password</label><input id="confirm" type="password" required value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} /></div>
            <button className="btn btn-primary" type="submit">Update password</button>
          </form>
        </article>
      </div>
    </section>
  );
}
