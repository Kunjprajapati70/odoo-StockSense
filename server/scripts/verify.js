import 'dotenv/config';
import { readDevOtp } from '../utils/devMailbox.js';

const base = 'http://127.0.0.1:5000/api';

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || response.statusText);
    error.status = response.status;
    throw error;
  }
  return data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const managerLogin = await api('/auth/login', {
  method: 'POST',
  body: { email: 'manager@stocksense.demo', password: 'StockSense#2026' },
});
const manager = managerLogin.data.token;

try {
  await api('/auth/login', {
    method: 'POST',
    body: { email: 'unverified@stocksense.demo', password: 'StockSense#2026' },
  });
  throw new Error('Unverified login should fail');
} catch (error) {
  assert(error.status === 403, `Expected unverified 403, got ${error.status}`);
}

const staffLogin = await api('/auth/login', {
  method: 'POST',
  body: { email: 'staff@stocksense.demo', password: 'StockSense#2026' },
});
const staff = staffLogin.data.token;
try {
  await api('/products', { method: 'POST', token: staff, body: { name: 'Blocked', sku: 'NOPE', unit: 'PCS' } });
  throw new Error('Staff product create should fail');
} catch (error) {
  assert(error.status === 403, `Expected staff 403, got ${error.status}`);
}

const categories = await api('/categories?limit=5', { token: manager });
const warehouses = await api('/warehouses?limit=5', { token: manager });
const warehouse = warehouses.data[0];
const locations = warehouse.locations;
assert(locations.length >= 2, 'Need two locations');

const sku = `QA-${Date.now()}`;
const created = await api('/products', {
  method: 'POST',
  token: manager,
  body: {
    name: 'Verification Bolt',
    sku,
    category: categories.data[0]._id,
    unit: 'PCS',
    reorderLevel: 10,
    initialStock: 0,
    description: 'Workflow check',
  },
});
const productId = created.data._id;

const receipt = await api('/receipts', {
  method: 'POST',
  token: manager,
  body: {
    supplier: 'QA Supplier',
    warehouse: warehouse._id,
    location: locations[0]._id,
    items: [{ product: productId, quantity: 100 }],
  },
});
await api(`/receipts/${receipt.data._id}/validate`, { method: 'POST', token: manager });
let product = await api(`/products/${productId}`, { token: manager });
assert(product.data.currentStock === 100, `Expected 100 after receipt, got ${product.data.currentStock}`);

const delivery = await api('/deliveries', {
  method: 'POST',
  token: manager,
  body: {
    customer: 'QA Customer',
    warehouse: warehouse._id,
    location: locations[0]._id,
    items: [{ product: productId, quantity: 20 }],
  },
});
await api(`/deliveries/${delivery.data._id}/validate`, { method: 'POST', token: manager });
product = await api(`/products/${productId}`, { token: manager });
assert(product.data.currentStock === 80, `Expected 80 after delivery, got ${product.data.currentStock}`);

try {
  const tooMuch = await api('/deliveries', {
    method: 'POST',
    token: manager,
    body: {
      customer: 'QA Customer',
      warehouse: warehouse._id,
      location: locations[0]._id,
      items: [{ product: productId, quantity: 1000 }],
    },
  });
  await api(`/deliveries/${tooMuch.data._id}/validate`, { method: 'POST', token: manager });
  throw new Error('Oversized delivery should fail');
} catch (error) {
  assert(error.message.includes('Insufficient stock'), error.message);
}

const transfer = await api('/transfers', {
  method: 'POST',
  token: manager,
  body: {
    sourceWarehouse: warehouse._id,
    sourceLocation: locations[0]._id,
    destinationWarehouse: warehouse._id,
    destinationLocation: locations[1]._id,
    items: [{ product: productId, quantity: 30 }],
  },
});
await api(`/transfers/${transfer.data._id}/validate`, { method: 'POST', token: manager });
product = await api(`/products/${productId}`, { token: manager });
assert(product.data.currentStock === 80, `Transfer changed total stock: ${product.data.currentStock}`);
const source = product.data.locations.find((level) => String(level.location._id || level.location) === String(locations[0]._id));
const destination = product.data.locations.find((level) => String(level.location._id || level.location) === String(locations[1]._id));
assert(source.quantity === 50, `Source should be 50, got ${source?.quantity}`);
assert(destination.quantity === 30, `Destination should be 30, got ${destination?.quantity}`);

const adjustment = await api('/adjustments', {
  method: 'POST',
  token: manager,
  body: {
    warehouse: warehouse._id,
    location: locations[0]._id,
    reason: 'Physical count',
    items: [{ product: productId, physicalCount: 45 }],
  },
});
await api(`/adjustments/${adjustment.data._id}/validate`, { method: 'POST', token: manager });
product = await api(`/products/${productId}`, { token: manager });
assert(source, 'source missing');
const sourceAfter = product.data.locations.find((level) => String(level.location._id || level.location) === String(locations[0]._id));
assert(sourceAfter.quantity === 45, `Adjusted source should be 45, got ${sourceAfter.quantity}`);
assert(product.data.currentStock === 75, `Company stock should be 75, got ${product.data.currentStock}`);

const ledger = await api(`/ledger?product=${productId}&limit=20`, { token: manager });
const types = ledger.data.map((row) => row.type).sort();
assert(types.includes('RECEIPT') && types.includes('DELIVERY') && types.includes('TRANSFER') && types.includes('ADJUSTMENT'), `Ledger types ${types.join(',')}`);

await api('/auth/forgot-password', { method: 'POST', body: { email: 'manager@stocksense.demo' } });
const otp = readDevOtp('manager@stocksense.demo');
assert(otp, 'OTP was not stored for development verification');
const verified = await api('/auth/verify-otp', { method: 'POST', body: { email: 'manager@stocksense.demo', otp } });
await api('/auth/reset-password', {
  method: 'POST',
  body: { resetToken: verified.data.resetToken, password: 'StockSense#2026', confirmPassword: 'StockSense#2026' },
});
await api('/auth/login', { method: 'POST', body: { email: 'manager@stocksense.demo', password: 'StockSense#2026' } });

const dashboard = await api('/dashboard?range=30d', { token: manager });
assert(dashboard.data.kpis.productsInStock > 0, 'Dashboard has no stocked products');
assert(Array.isArray(dashboard.data.movement), 'Movement chart missing');
assert(dashboard.data.byCategory.length > 0, 'Category chart missing');

console.log('Workflow checks passed.');
