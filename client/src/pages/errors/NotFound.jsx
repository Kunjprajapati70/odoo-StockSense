import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <Link to={ROUTES.DASHBOARD}>Back to dashboard</Link>
    </main>
  );
}
