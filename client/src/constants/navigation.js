import { ROUTES } from './routes';

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: ROUTES.DASHBOARD }],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Products', to: ROUTES.PRODUCTS },
      { label: 'Warehouse', to: ROUTES.WAREHOUSE },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Receipts', to: ROUTES.RECEIPTS },
      { label: 'Deliveries', to: ROUTES.DELIVERIES },
      { label: 'Transfers', to: ROUTES.TRANSFERS },
      { label: 'Adjustments', to: ROUTES.ADJUSTMENTS },
      { label: 'Move history', to: ROUTES.MOVE_HISTORY },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: ROUTES.PROFILE },
      { label: 'Settings', to: ROUTES.SETTINGS },
    ],
  },
];
