import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function Header() {
  return (
    <header className="topbar">
      <p>Inventory workspace</p>
      <Link to={ROUTES.PROFILE}>Profile</Link>
    </header>
  );
}
