import { Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import VerifyOTP from '../pages/auth/VerifyOTP';
import Adjustments from '../pages/adjustments/Adjustments';
import Dashboard from '../pages/dashboard/Dashboard';
import Deliveries from '../pages/deliveries/Deliveries';
import NotFound from '../pages/errors/NotFound';
import MoveHistory from '../pages/move-history/MoveHistory';
import Products from '../pages/products/Products';
import Profile from '../pages/profile/Profile';
import Receipts from '../pages/receipts/Receipts';
import Settings from '../pages/settings/Settings';
import Transfers from '../pages/transfers/Transfers';
import Warehouses from '../pages/warehouse/Warehouses';
import { ROUTES } from '../constants/routes';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<Signup />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.VERIFY_OTP} element={<VerifyOTP />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.PRODUCTS} element={<Products />} />
          <Route path={ROUTES.RECEIPTS} element={<Receipts />} />
          <Route path={ROUTES.DELIVERIES} element={<Deliveries />} />
          <Route path={ROUTES.TRANSFERS} element={<Transfers />} />
          <Route path={ROUTES.ADJUSTMENTS} element={<Adjustments />} />
          <Route path={ROUTES.MOVE_HISTORY} element={<MoveHistory />} />
          <Route path={ROUTES.WAREHOUSE} element={<Warehouses />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
