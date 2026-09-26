import mongoose from 'mongoose';
import Delivery from '../models/Delivery.js';
import Product from '../models/Product.js';
import Receipt from '../models/Receipt.js';
import ReorderRule from '../models/ReorderRule.js';
import StockLedger from '../models/StockLedger.js';
import StockLevel from '../models/StockLevel.js';
import Transfer from '../models/Transfer.js';
import { DOC_STATUS, MOVE_TYPES, STOCK_STATUS } from '../utils/constants.js';
import { eachDay, resolveRange } from '../utils/dates.js';

const PENDING = [DOC_STATUS.DRAFT, DOC_STATUS.WAITING, DOC_STATUS.READY];

function oid(value) {
  return new mongoose.Types.ObjectId(String(value));
}

function statusOf(isActive, quantity, reorderLevel) {
  if (!isActive) return STOCK_STATUS.INACTIVE;
  if (quantity <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (quantity <= reorderLevel) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

async function stockRows(filters) {
  const match = {};
  if (filters.warehouse) match.warehouse = oid(filters.warehouse);
  if (filters.location) match.location = oid(filters.location);

  const productMatch = {};
  if (filters.category) productMatch['product.category'] = oid(filters.category);

  return StockLevel.aggregate([
    { $match: match },
    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $match: productMatch },
    { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouseDoc' } },
    { $unwind: '$warehouseDoc' },
  ]);
}

function summarizeProducts(rows) {
  const byProduct = new Map();
  for (const row of rows) {
    const id = String(row.product._id);
    const current = byProduct.get(id) || {
      id,
      name: row.product.name,
      sku: row.product.sku,
      unit: row.product.unit,
      reorderLevel: row.product.reorderLevel,
      isActive: row.product.isActive,
      category: row.category?.name || 'Uncategorized',
      quantity: 0,
    };
    current.quantity += row.quantity;
    byProduct.set(id, current);
  }

  const products = [...byProduct.values()].map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * 1000) / 1000,
    stockStatus: statusOf(item.isActive, item.quantity, item.reorderLevel),
  }));

  const active = products.filter((item) => item.isActive);
  return {
    products,
    inStock: active.filter((item) => item.stockStatus === STOCK_STATUS.IN_STOCK).length,
    lowStock: active.filter((item) => item.stockStatus === STOCK_STATUS.LOW_STOCK),
    outOfStock: active.filter((item) => item.stockStatus === STOCK_STATUS.OUT_OF_STOCK),
    units: Math.round(active.reduce((sum, item) => sum + item.quantity, 0) * 1000) / 1000,
  };
}

function pendingStatus(status) {
  if (!status || status === 'all') return { $in: PENDING };
  if (PENDING.includes(status)) return status;
  return null;
}

async function countDocs(Model, filters, field = 'warehouse') {
  const status = pendingStatus(filters.status);
  if (!status) return 0;
  const query = { status };
  if (filters.warehouse) query[field] = filters.warehouse;
  if (filters.location && field === 'warehouse') query.location = filters.location;
  query.date = { $gte: filters.from, $lte: filters.to };
  return Model.countDocuments(query);
}

export async function getDashboard(query) {
  const { from, to } = resolveRange(query);
  const filters = {
    from,
    to,
    warehouse: query.warehouse || '',
    location: query.location || '',
    category: query.category || '',
    status: query.status || 'all',
    documentType: query.documentType || 'all',
  };

  const rows = await stockRows(filters);
  const summary = summarizeProducts(rows);
  const catalog = await Product.find(filters.category ? { category: filters.category } : {}).populate('category', 'name');
  const known = new Set(summary.products.map((item) => item.id));
  for (const product of catalog) {
    if (known.has(String(product._id))) continue;
    summary.products.push({
      id: String(product._id),
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      reorderLevel: product.reorderLevel,
      isActive: product.isActive,
      category: product.category?.name || 'Uncategorized',
      quantity: 0,
      stockStatus: statusOf(product.isActive, 0, product.reorderLevel),
    });
  }
  const activeProducts = summary.products.filter((item) => item.isActive);
  summary.lowStock = activeProducts.filter((item) => item.stockStatus === STOCK_STATUS.LOW_STOCK);
  summary.outOfStock = activeProducts.filter((item) => item.stockStatus === STOCK_STATUS.OUT_OF_STOCK);
  summary.units = Math.round(activeProducts.reduce((sum, item) => sum + item.quantity, 0) * 1000) / 1000;

  const typeAllowed = (type) => filters.documentType === 'all' || filters.documentType === type;
  const [receipts, deliveries, transfers] = await Promise.all([
    typeAllowed('receipt') ? countDocs(Receipt, filters) : 0,
    typeAllowed('delivery') ? countDocs(Delivery, filters) : 0,
    typeAllowed('transfer')
      ? (pendingStatus(filters.status)
        ? Transfer.countDocuments({
          status: pendingStatus(filters.status),
          date: { $gte: from, $lte: to },
          ...(filters.warehouse
            ? { $or: [{ sourceWarehouse: filters.warehouse }, { destinationWarehouse: filters.warehouse }] }
            : {}),
        })
        : 0)
      : 0,
  ]);

  const moveTypes = [];
  if (typeAllowed('receipt')) moveTypes.push(MOVE_TYPES.RECEIPT);
  if (typeAllowed('delivery')) moveTypes.push(MOVE_TYPES.DELIVERY);
  if (typeAllowed('transfer')) moveTypes.push(MOVE_TYPES.TRANSFER);
  if (typeAllowed('adjustment')) moveTypes.push(MOVE_TYPES.ADJUSTMENT);

  const ledgerMatch = {
    occurredAt: { $gte: from, $lte: to },
    type: { $in: moveTypes.length ? moveTypes : ['__none__'] },
  };
  if (filters.warehouse) {
    ledgerMatch.$or = [
      { warehouse: oid(filters.warehouse) },
      { sourceWarehouse: oid(filters.warehouse) },
      { destinationWarehouse: oid(filters.warehouse) },
    ];
  }
  if (filters.location) {
    ledgerMatch.$and = [{
      $or: [
        { location: oid(filters.location) },
        { sourceLocation: oid(filters.location) },
        { destinationLocation: oid(filters.location) },
      ],
    }];
  }
  if (filters.category) {
    const ids = await Product.find({ category: filters.category }).distinct('_id');
    ledgerMatch.product = { $in: ids };
  }

  const grouped = await StockLedger.aggregate([
    { $match: ledgerMatch },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } },
        incoming: { $sum: { $cond: [{ $eq: ['$type', MOVE_TYPES.RECEIPT] }, '$quantity', 0] } },
        outgoing: { $sum: { $cond: [{ $eq: ['$type', MOVE_TYPES.DELIVERY] }, '$quantity', 0] } },
        adjustments: { $sum: { $cond: [{ $eq: ['$type', MOVE_TYPES.ADJUSTMENT] }, '$signedQuantity', 0] } },
      },
    },
  ]);
  const groupedMap = new Map(grouped.map((row) => [row._id, row]));
  const movement = eachDay(from, to).map((date) => ({
    date,
    incoming: groupedMap.get(date)?.incoming || 0,
    outgoing: groupedMap.get(date)?.outgoing || 0,
    adjustments: groupedMap.get(date)?.adjustments || 0,
  }));

  const categoryMap = new Map();
  for (const item of summary.products) {
    categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.quantity);
  }
  const byCategory = [...categoryMap.entries()]
    .map(([category, quantity]) => ({ category, quantity: Math.round(quantity * 1000) / 1000 }))
    .sort((a, b) => b.quantity - a.quantity);

  const warehouseMap = new Map();
  for (const row of rows) {
    const name = row.warehouseDoc.name;
    warehouseMap.set(name, (warehouseMap.get(name) || 0) + row.quantity);
  }
  const byWarehouse = [...warehouseMap.entries()]
    .map(([warehouse, quantity]) => ({ warehouse, quantity: Math.round(quantity * 1000) / 1000 }))
    .sort((a, b) => b.quantity - a.quantity);

  const recent = await StockLedger.find(ledgerMatch)
    .sort({ occurredAt: -1 })
    .limit(8)
    .select('occurredAt productName sku type reference quantity signedQuantity userName warehouseName locationName');

  const lowStock = summary.lowStock
    .sort((a, b) => a.quantity / Math.max(a.reorderLevel, 1) - b.quantity / Math.max(b.reorderLevel, 1))
    .slice(0, 6);

  return {
    range: { from, to },
    kpis: {
      productsInStock: summary.products.filter((item) => item.isActive && item.quantity > 0).length,
      unitsOnHand: summary.units,
      lowStock: summary.lowStock.length,
      outOfStock: summary.outOfStock.length,
      pendingReceipts: receipts || 0,
      pendingDeliveries: deliveries || 0,
      scheduledTransfers: transfers || 0,
    },
    movement,
    byCategory,
    byWarehouse,
    lowStock,
    recent,
  };
}

export async function getAlerts() {
  const rows = await stockRows({});
  const summary = summarizeProducts(rows);
  const rules = await ReorderRule.find({ isActive: true })
    .populate('product', 'name sku unit isActive')
    .populate('warehouse', 'name code');

  const warehouseQty = new Map();
  for (const row of rows) {
    const key = `${row.product._id}:${row.warehouse}`;
    warehouseQty.set(key, (warehouseQty.get(key) || 0) + row.quantity);
  }

  const ruleAlerts = [];
  for (const rule of rules) {
    if (!rule.product?.isActive) continue;
    const quantity = warehouseQty.get(`${rule.product._id}:${rule.warehouse._id}`) || 0;
    if (quantity <= rule.reorderLevel) {
      ruleAlerts.push({
        productId: rule.product._id,
        name: rule.product.name,
        sku: rule.product.sku,
        unit: rule.product.unit,
        quantity: Math.round(quantity * 1000) / 1000,
        reorderLevel: rule.reorderLevel,
        warehouse: rule.warehouse.name,
        scope: quantity <= 0 ? 'out_of_stock' : 'low_stock',
      });
    }
  }

  return {
    lowStock: summary.lowStock,
    outOfStock: summary.outOfStock,
    warehouseRules: ruleAlerts,
  };
}

