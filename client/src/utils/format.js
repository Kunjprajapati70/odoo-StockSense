export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatDateParts(value) {
  if (!value) return { day: '—', time: '' };
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(date),
  };
}

export function formatDay(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function roleLabel(role) {
  return role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff';
}

export const STATUS_LABELS = {
  draft: 'Draft',
  waiting: 'Waiting',
  ready: 'Ready',
  done: 'Done',
  canceled: 'Canceled',
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  inactive: 'Inactive',
  active: 'Active',
  RECEIPT: 'Receipt',
  DELIVERY: 'Delivery',
  TRANSFER: 'Transfer',
  ADJUSTMENT: 'Adjustment',
};

export function toDateInput(value) {
  const date = value ? new Date(value) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
