import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { ROUTES } from '../../constants/routes';

export default function VerifyOTP() {
  return (
    <section>
      <PageHeader
        title="Verify code"
        description="OTP verification will be connected when authentication is implemented."
      />
      <p className="auth-links">
        <Link to={ROUTES.FORGOT_PASSWORD}>Request a new code</Link>
        <Link to={ROUTES.LOGIN}>Back to log in</Link>
      </p>
    </section>
  );
}
