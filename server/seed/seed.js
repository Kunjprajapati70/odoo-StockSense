import 'dotenv/config';
import { connectDB, ensureCollections, models } from '../config/db.js';
import Location from '../models/Location.js';
import Product from '../models/Product.js';
import ReorderRule from '../models/ReorderRule.js';
import StockLevel from '../models/StockLevel.js';
import User from '../models/User.js';
import {
  cancelAdjustment,
  createAdjustment,
  createDelivery,
  createReceipt,
  createTransfer,
  updateDelivery,
  updateReceipt,
  updateTransfer,
  validateAdjustment,
  validateDelivery,
  validateReceipt,
  validateTransfer,
} from '../services/operationService.js';
import {
  CATEGORIES,
  CUSTOMERS,
  DEMO_PASSWORD,
  LOCATION_TEMPLATES,
  PRODUCTS,
  REASONS,
  SUPPLIERS,
  USERS,
  WAREHOUSES,
} from './catalog.js';
import Category from '../models/Category.js';
import Warehouse from '../models/Warehouse.js';
import Receipt from '../models/Receipt.js';
import Delivery from '../models/Delivery.js';
import Transfer from '../models/Transfer.js';
import Adjustment from '../models/Adjustment.js';
import StockLedger from '../models/StockLedger.js';

function mulberry32(seed) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function sample(rand, list, count) {
  const copy = [...list];
  const chosen = [];
  while (chosen.length < count && copy.length) {
    const index = Math.floor(rand() * copy.length);
    chosen.push(copy.splice(index, 1)[0]);
  }
  return chosen;
}

function daysAgo(rand, days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(8 + Math.floor(rand() * 9), Math.floor(rand() * 60), 0, 0);
  return date;
}

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stocksense?replicaSet=rs0';
  await connectDB(uri);
  await ensureCollections();
  for (const model of models) {
    await model.deleteMany({});
  }

  const rand = mulberry32(20260326);
  const users = [];
  for (const [name, email, role, status] of USERS) {
    users.push(await User.create({ name, email, password: DEMO_PASSWORD, role, status }));
  }
  const operators = users.filter((user) => user.status === 'active');

  const categories = [];
  for (const [name, description] of CATEGORIES) {
    categories.push(await Category.create({ name, description }));
  }
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  const warehouses = [];
  for (const [name, code, address, contact] of WAREHOUSES) {
    warehouses.push(await Warehouse.create({ name, code, address, contact, isActive: true }));
  }

  const locations = [];
  for (const warehouse of warehouses) {
    for (const [name, code] of LOCATION_TEMPLATES) {
      locations.push(await Location.create({
        name,
        code: `${warehouse.code.slice(-3)}-${code}`,
        warehouse: warehouse._id,
        isActive: true,
        notes: `${name} at ${warehouse.name}`,
      }));
    }
  }
  const locationsByWarehouse = new Map(warehouses.map((warehouse) => [
    String(warehouse._id),
    locations.filter((location) => String(location.warehouse) === String(warehouse._id)),
  ]));

  const products = [];
  for (const [name, sku, categoryName, unit, reorderLevel] of PRODUCTS) {
    products.push(await Product.create({
      name,
      sku,
      category: categoryByName.get(categoryName)._id,
      unit,
      reorderLevel,
      description: `${name} stocked for warehouse operations.`,
      isActive: true,
    }));
  }

  for (let index = 0; index < 54; index += 1) {
    const product = products[index];
    const warehouse = warehouses[index % warehouses.length];
    await ReorderRule.create({
      product: product._id,
      warehouse: warehouse._id,
      reorderLevel: Math.max(1, Math.round(product.reorderLevel * (index % 3 === 0 ? 0.4 : 0.7))),
      isActive: true,
    });
  }

  const receiptPlan = [
    ...Array(28).fill('done'),
    ...Array(4).fill('draft'),
    ...Array(4).fill('waiting'),
    ...Array(4).fill('ready'),
  ];

  for (let index = 0; index < receiptPlan.length; index += 1) {
    const warehouse = warehouses[index % warehouses.length];
    const location = pick(rand, locationsByWarehouse.get(String(warehouse._id)));
    const lines = sample(rand, products, 3).map((product) => ({
      product: product._id,
      quantity: 40 + Math.floor(rand() * 160),
    }));
    const user = operators[index % operators.length];
    const receipt = await createReceipt({
      supplier: pick(rand, SUPPLIERS),
      warehouse: warehouse._id,
      location: location._id,
      items: lines,
      date: daysAgo(rand, 50 - Math.floor(index * 1.2)),
      notes: index % 4 === 0 ? 'Scheduled inbound from the weekly purchase plan.' : '',
    }, user);
    const target = receiptPlan[index];
    if (target === 'done') await validateReceipt(receipt._id, user);
    else if (target !== 'draft') await updateReceipt(receipt._id, { status: target }, user);
  }

  let doneDeliveries = 0;
  for (let index = 0; index < 40; index += 1) {
    const levels = await StockLevel.find({ quantity: { $gte: 8 } }).limit(80);
    const user = operators[(index + 1) % operators.length];
    const wantDone = doneDeliveries < 26;
    if (wantDone && levels.length) {
      const level = levels[Math.floor(rand() * levels.length)];
      const siblings = levels.filter((item) => String(item.location) === String(level.location)).slice(0, 3);
      const delivery = await createDelivery({
        customer: pick(rand, CUSTOMERS),
        warehouse: level.warehouse,
        location: level.location,
        items: siblings.map((item) => ({
          product: item.product,
          quantity: Math.max(1, Math.min(Math.floor(item.quantity * 0.2), 20)),
        })),
        date: daysAgo(rand, 20 - (index % 15)),
        notes: 'Customer dispatch.',
      }, user);
      await validateDelivery(delivery._id, user);
      doneDeliveries += 1;
    } else {
      const warehouse = pick(rand, warehouses);
      const location = pick(rand, locationsByWarehouse.get(String(warehouse._id)));
      const delivery = await createDelivery({
        customer: pick(rand, CUSTOMERS),
        warehouse: warehouse._id,
        location: location._id,
        items: sample(rand, products, 3).map((item) => ({
          product: item._id,
          quantity: 2 + Math.floor(rand() * 4),
        })),
        date: daysAgo(rand, index % 10),
        notes: 'Waiting for pick confirmation.',
      }, user);
      const status = ['draft', 'waiting', 'ready'][index % 3];
      if (status !== 'draft') await updateDelivery(delivery._id, { status });
    }
  }

  for (let extra = 0; extra < 8; extra += 1) {
    const warehouse = warehouses[extra % warehouses.length];
    const location = locationsByWarehouse.get(String(warehouse._id))[extra % 6];
    await createDelivery({
      customer: CUSTOMERS[extra % CUSTOMERS.length],
      warehouse: warehouse._id,
      location: location._id,
      items: sample(rand, products, 4).map((item) => ({ product: item._id, quantity: 3 })),
      date: daysAgo(rand, extra + 1),
      notes: 'Additional open delivery for the planning board.',
    }, operators[extra % operators.length]);
  }

  let doneTransfers = 0;
  for (let index = 0; index < 30; index += 1) {
    const levels = await StockLevel.find({ quantity: { $gte: 6 } });
    const user = operators[(index + 2) % operators.length];
    if (doneTransfers < 18 && levels.length) {
      const level = levels[Math.floor(rand() * levels.length)];
      const candidates = locations.filter((location) => String(location._id) !== String(level.location));
      const destination = pick(rand, candidates);
      const quantity = Math.max(1, Math.min(Math.floor(level.quantity * 0.3), 25));
      const transfer = await createTransfer({
        sourceWarehouse: level.warehouse,
        sourceLocation: level.location,
        destinationWarehouse: destination.warehouse,
        destinationLocation: destination._id,
        items: [{ product: level.product, quantity }],
        date: daysAgo(rand, 12 - (index % 8)),
        notes: 'Rebalance stock between locations.',
      }, user);
      await validateTransfer(transfer._id, user);
      doneTransfers += 1;
    } else {
      const source = pick(rand, locations);
      const destination = pick(rand, locations.filter((location) => String(location._id) !== String(source._id)));
      const transfer = await createTransfer({
        sourceWarehouse: source.warehouse,
        sourceLocation: source._id,
        destinationWarehouse: destination.warehouse,
        destinationLocation: destination._id,
        items: [{ product: pick(rand, products)._id, quantity: 4 }],
        date: daysAgo(rand, index % 6),
        notes: 'Planned relocation.',
      }, user);
      const status = ['draft', 'waiting', 'ready'][index % 3];
      if (status !== 'draft') await updateTransfer(transfer._id, { status });
    }
  }

  const stocked = await StockLevel.find({ quantity: { $gt: 0 } }).populate('product');
  const forcedOut = stocked.slice(0, 4);
  const forcedLow = stocked.filter((level) => level.product.reorderLevel > 0).slice(4, 12);
  let adjustmentIndex = 0;

  async function adjust(level, physical, user, reason) {
    const doc = await createAdjustment({
      warehouse: level.warehouse,
      location: level.location,
      items: [{ product: level.product._id || level.product, physicalCount: physical }],
      reason,
      date: daysAgo(rand, adjustmentIndex % 9),
      notes: 'Physical inventory count.',
    }, user);
    await validateAdjustment(doc._id, user);
    adjustmentIndex += 1;
  }

  for (const level of forcedOut) {
    await adjust(level, 0, operators[0], 'Cycle count found the location empty.');
  }
  for (const level of forcedLow) {
    const target = Math.max(1, Math.min(level.quantity, Math.floor(level.product.reorderLevel * 0.8) || 1));
    if (target < level.quantity) {
      await adjust(level, target, operators[1], 'Stock is below the reorder level after recount.');
    }
  }
  const remaining = await StockLevel.find({ quantity: { $gte: 5 } }).limit(20);
  while (adjustmentIndex < 20 && remaining.length) {
    const level = remaining[adjustmentIndex % remaining.length];
    const delta = (adjustmentIndex % 2 === 0 ? -2 : 3);
    const physical = Math.max(0, level.quantity + delta);
    await adjust(level, physical, operators[adjustmentIndex % operators.length], pick(rand, REASONS));
  }
  for (let index = adjustmentIndex; index < 25; index += 1) {
    const warehouse = pick(rand, warehouses);
    const location = pick(rand, locationsByWarehouse.get(String(warehouse._id)));
    const doc = await createAdjustment({
      warehouse: warehouse._id,
      location: location._id,
      items: [{ product: pick(rand, products)._id, physicalCount: 12 }],
      reason: pick(rand, REASONS),
      date: daysAgo(rand, 2),
      notes: 'Count scheduled, not posted.',
    }, operators[2]);
    if (index % 2 === 0) await cancelAdjustment(doc._id);
  }

  const [usersCount, categoryCount, warehouseCount, locationCount, productCount, receiptCount, deliveryCount, transferCount, adjustmentCount, ledgerCount, ruleCount, receiptItems, deliveryItems] = await Promise.all([
    User.countDocuments(),
    Category.countDocuments(),
    Warehouse.countDocuments(),
    Location.countDocuments(),
    Product.countDocuments(),
    Receipt.countDocuments(),
    Delivery.countDocuments(),
    Transfer.countDocuments(),
    Adjustment.countDocuments(),
    StockLedger.countDocuments(),
    ReorderRule.countDocuments(),
    Receipt.aggregate([{ $project: { count: { $size: '$items' } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
    Delivery.aggregate([{ $project: { count: { $size: '$items' } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
  ]);

  const summary = {
    users: usersCount,
    categories: categoryCount,
    warehouses: warehouseCount,
    locations: locationCount,
    products: productCount,
    receipts: receiptCount,
    receiptItems: receiptItems[0]?.total || 0,
    deliveries: deliveryCount,
    deliveryItems: deliveryItems[0]?.total || 0,
    transfers: transferCount,
    adjustments: adjustmentCount,
    ledger: ledgerCount,
    reorderRules: ruleCount,
  };
  console.log(summary);
  const minimums = {
    users: 8, categories: 12, warehouses: 4, locations: 20, products: 80,
    receipts: 40, receiptItems: 100, deliveries: 40, deliveryItems: 100,
    transfers: 30, adjustments: 25, ledger: 200, reorderRules: 50,
  };
  for (const [key, minimum] of Object.entries(minimums)) {
    if (summary[key] < minimum) {
      throw new Error(`Seed check failed: ${key} is ${summary[key]}, expected at least ${minimum}.`);
    }
  }
  console.log('Demo data is ready.');
  console.log(`Manager: manager@stocksense.demo / ${DEMO_PASSWORD}`);
  console.log(`Staff: staff@stocksense.demo / ${DEMO_PASSWORD}`);
  await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
}

main().catch(async (error) => {
  console.error(error);
  const mongoose = (await import('mongoose')).default;
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
