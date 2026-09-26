export const ROLES = {
  MANAGER: 'inventory_manager',
  STAFF: 'warehouse_staff',
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  UNVERIFIED: 'unverified',
};

export const DOC_STATUS = {
  DRAFT: 'draft',
  WAITING: 'waiting',
  READY: 'ready',
  DONE: 'done',
  CANCELED: 'canceled',
};

export const OPEN_STATUSES = [
  DOC_STATUS.DRAFT,
  DOC_STATUS.WAITING,
  DOC_STATUS.READY,
];

export const MOVE_TYPES = {
  RECEIPT: 'RECEIPT',
  DELIVERY: 'DELIVERY',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
};

export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  INACTIVE: 'inactive',
};

export const UNITS = ['PCS', 'KG', 'M', 'L', 'BOX', 'SET', 'ROLL'];
