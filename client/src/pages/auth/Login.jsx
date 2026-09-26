import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { ROUTES } from '../../constants/routes';

export default function Login() {
  return (
    <section>
      <PageHeader
        title="Log in"
        description="Sign-in will be connected when authentication is implemented."
      />
      <p className="auth-links">
        <Link to={ROUTES.SIGNUP}>Create an account</Link>
        <Link to={ROUTES.FORGOT_PASSWORD}>Forgot password</Link>
      </p>
    </section>
  );
}
