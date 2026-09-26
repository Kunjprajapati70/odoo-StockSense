import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { ROUTES } from '../../constants/routes';

export default function Signup() {
  return (
    <section>
      <PageHeader
        title="Create account"
        description="Registration will be connected when authentication is implemented."
      />
      <p className="auth-links">
        <Link to={ROUTES.LOGIN}>Already have an account</Link>
      </p>
    </section>
  );
}
