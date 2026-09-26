import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export function Forbidden() {
  return (
    <section className="page">
      <div className="card card-pad empty">
        <h1>403 — Forbidden</h1>
        <p>You do not have permission to perform this action.</p>
        <Link to={ROUTES.DASHBOARD}>Back to dashboard</Link>
      </div>
    </section>
  );
}

export function Unauthorized() {
  return (
    <main className="not-found">
      <h1>401 — Unauthorized</h1>
      <p>Your session is missing or has expired.</p>
      <Link to={ROUTES.LOGIN}>Log in</Link>
    </main>
  );
}

export function ServerError() {
  return (
    <main className="not-found">
      <h1>500 — Server error</h1>
      <p>The server could not complete that request.</p>
      <Link to={ROUTES.DASHBOARD}>Back to dashboard</Link>
    </main>
  );
}
