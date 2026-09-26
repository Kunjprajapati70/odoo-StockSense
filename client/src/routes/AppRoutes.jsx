import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { TableSkeleton } from '../components/common/States';
import { ROUTES } from '../constants/routes';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Login from '../pages/auth/Login';
import ResetPassword from '../pages/auth/ResetPassword';
import Signup from '../pages/auth/Signup';
import VerifyOTP from '../pages/auth/VerifyOTP';
import NotFound from '../pages/errors/NotFound';
import { Forbidden, ServerError, Unauthorized } from '../pages/errors/StatusPage';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Products = lazy(() => import('../pages/products/Products'));
const ProductDetail = lazy(() => import('../pages/products/ProductDetail'));
const Categories = lazy(() => import('../pages/products/Categories'));
const ReorderRules = lazy(() => import('../pages/products/ReorderRules'));
const Receipts = lazy(() => import('../pages/receipts/Receipts'));
const ReceiptDetail = lazy(() => import('../pages/receipts/ReceiptDetail'));
const Deliveries = lazy(() => import('../pages/deliveries/Deliveries'));
const DeliveryDetail = lazy(() => import('../pages/deliveries/DeliveryDetail'));
const Transfers = lazy(() => import('../pages/transfers/Transfers'));
const TransferDetail = lazy(() => import('../pages/transfers/TransferDetail'));
const Adjustments = lazy(() => import('../pages/adjustments/Adjustments'));
const AdjustmentDetail = lazy(() => import('../pages/adjustments/AdjustmentDetail'));
const MoveHistory = lazy(() => import('../pages/move-history/MoveHistory'));
const Warehouses = lazy(() => import('../pages/warehouse/Warehouses'));
const Alerts = lazy(() => import('../pages/notifications/Alerts'));
const Profile = lazy(() => import('../pages/profile/Profile'));
const Settings = lazy(() => import('../pages/settings/Settings'));

function Page({ children }) {
  return <Suspense fallback={<TableSkeleton />}>{children}</Suspense>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<Signup />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.VERIFY_OTP} element={<VerifyOTP />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Page><Dashboard /></Page>} />
          <Route path={ROUTES.PRODUCTS} element={<Page><Products /></Page>} />
          <Route path="/products/:id" element={<Page><ProductDetail /></Page>} />
          <Route path={ROUTES.CATEGORIES} element={<Page><Categories /></Page>} />
          <Route path={ROUTES.REORDER} element={<Page><ReorderRules /></Page>} />
          <Route path={ROUTES.RECEIPTS} element={<Page><Receipts /></Page>} />
          <Route path="/receipts/:id" element={<Page><ReceiptDetail /></Page>} />
          <Route path={ROUTES.DELIVERIES} element={<Page><Deliveries /></Page>} />
          <Route path="/deliveries/:id" element={<Page><DeliveryDetail /></Page>} />
          <Route path={ROUTES.TRANSFERS} element={<Page><Transfers /></Page>} />
          <Route path="/transfers/:id" element={<Page><TransferDetail /></Page>} />
          <Route path={ROUTES.ADJUSTMENTS} element={<Page><Adjustments /></Page>} />
          <Route path="/adjustments/:id" element={<Page><AdjustmentDetail /></Page>} />
          <Route path={ROUTES.MOVE_HISTORY} element={<Page><MoveHistory /></Page>} />
          <Route path={ROUTES.WAREHOUSE} element={<Page><Warehouses /></Page>} />
          <Route path={ROUTES.ALERTS} element={<Page><Alerts /></Page>} />
          <Route path={ROUTES.PROFILE} element={<Page><Profile /></Page>} />
          <Route path={ROUTES.SETTINGS} element={<Page><Settings /></Page>} />
          <Route path={ROUTES.FORBIDDEN} element={<Forbidden />} />
          <Route path={ROUTES.SERVER_ERROR} element={<ServerError />} />
        </Route>
      </Route>
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
