import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { ROUTES } from '../../constants/routes';

export default function ForgotPassword() {
  return (
    <section>
      <PageHeader
        title="Reset password"
        description="OTP password reset will be connected when authentication is implemented."
      />
      <p className="auth-links">
        <Link to={ROUTES.VERIFY_OTP}>Enter verification code</Link>
        <Link to={ROUTES.LOGIN}>Back to log in</Link>
      </p>
    </section>
  );
}
