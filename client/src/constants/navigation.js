import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Boxes,
  LayoutDashboard,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Tags,
  UserRound,
  Warehouse,
} from 'lucide-react';
import { ROUTES } from './routes';

export const NAV_SECTIONS = [
  {
    label: 'Monitor',
    items: [
      { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
      { label: 'Alerts', to: ROUTES.ALERTS, icon: Bell },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Products', to: ROUTES.PRODUCTS, icon: Boxes },
      { label: 'Categories', to: ROUTES.CATEGORIES, icon: Tags },
      { label: 'Reorder rules', to: ROUTES.REORDER, icon: SlidersHorizontal },
      { label: 'Warehouses', to: ROUTES.WAREHOUSE, icon: Warehouse },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Receipts', to: ROUTES.RECEIPTS, icon: ArrowDownToLine },
      { label: 'Delivery orders', to: ROUTES.DELIVERIES, icon: ArrowUpFromLine },
      { label: 'Internal transfers', to: ROUTES.TRANSFERS, icon: ArrowLeftRight },
      { label: 'Adjustments', to: ROUTES.ADJUSTMENTS, icon: SlidersHorizontal },
      { label: 'Stock ledger', to: ROUTES.MOVE_HISTORY, icon: ScrollText },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: ROUTES.PROFILE, icon: UserRound },
      { label: 'Settings', to: ROUTES.SETTINGS, icon: Settings },
    ],
  },
];
