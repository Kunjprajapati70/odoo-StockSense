import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <p className="muted">The page you requested is not part of StockSense.</p>
      <Link to={ROUTES.DASHBOARD}>Back to dashboard</Link>
    </main>
  );
}
