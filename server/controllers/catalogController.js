import Category from '../models/Category.js';
import Location from '../models/Location.js';
import Product from '../models/Product.js';
import ReorderRule from '../models/ReorderRule.js';
import StockLedger from '../models/StockLedger.js';
import StockLevel from '../models/StockLevel.js';
import User from '../models/User.js';
import Warehouse from '../models/Warehouse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/numbers.js';
import { pageMeta, parsePage } from '../utils/pagination.js';
import { getAlerts } from '../services/dashboardService.js';

export const listCategories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.search) filter.name = new RegExp(escapeRegex(req.query.search), 'i');
  const [items, total] = await Promise.all([
    Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(page, limit, total) });
});

export const createCategory = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new ApiError(400, 'Category name is required.');
  const category = await Category.create({
    name: req.body.name.trim(),
    description: req.body.description?.trim() || '',
  });
  res.status(201).json({ success: true, message: 'Category created successfully.', data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  if (req.body.name) category.name = req.body.name.trim();
  if (req.body.description !== undefined) category.description = req.body.description.trim();
  await category.save();
  res.json({ success: true, message: 'Category updated successfully.', data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0) {
    if (!req.body.reassignTo) {
      throw new ApiError(400, 'This category is used by products. Choose another category to reassign them before deleting.');
    }
    if (String(req.body.reassignTo) === String(category._id)) {
      throw new ApiError(400, 'Choose a different category for reassignment.');
    }
    const target = await Category.findById(req.body.reassignTo);
    if (!target) throw new ApiError(400, 'Reassignment category was not found.');
    await Product.updateMany({ category: category._id }, { category: target._id });
  }
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted successfully.' });
});

export const listWarehouses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage({ ...req.query, limit: req.query.limit || 50 });
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { code: rx }, { address: rx }];
  }
  if (req.query.active === 'true') filter.isActive = true;
  const [items, total] = await Promise.all([
    Warehouse.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Warehouse.countDocuments(filter),
  ]);
  const ids = items.map((item) => item._id);
  const locations = await Location.find({ warehouse: { $in: ids } }).sort({ name: 1 });
  const data = items.map((warehouse) => ({
    ...warehouse.toObject(),
    locations: locations.filter((location) => String(location.warehouse) === String(warehouse._id)),
  }));
  res.json({ success: true, data, meta: pageMeta(page, limit, total) });
});

export const createWarehouse = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim() || !req.body.code?.trim()) {
    throw new ApiError(400, 'Warehouse name and code are required.');
  }
  const warehouse = await Warehouse.create({
    name: req.body.name.trim(),
    code: req.body.code,
    address: req.body.address?.trim() || '',
    contact: req.body.contact?.trim() || '',
    isActive: req.body.isActive !== false,
  });
  res.status(201).json({ success: true, message: 'Warehouse created successfully.', data: warehouse });
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) throw new ApiError(404, 'Warehouse not found.');
  if (req.body.name) warehouse.name = req.body.name.trim();
  if (req.body.code) warehouse.code = req.body.code;
  if (req.body.address !== undefined) warehouse.address = req.body.address.trim();
  if (req.body.contact !== undefined) warehouse.contact = req.body.contact.trim();
  if (req.body.isActive !== undefined) warehouse.isActive = Boolean(req.body.isActive);
  await warehouse.save();
  res.json({ success: true, message: 'Warehouse updated successfully.', data: warehouse });
});

export const listLocations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  if (req.query.active === 'true') filter.isActive = true;
  const locations = await Location.find(filter).populate('warehouse', 'name code').sort({ name: 1 });
  res.json({ success: true, data: locations });
});

export const createLocation = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.body.warehouse);
  if (!warehouse) throw new ApiError(400, 'Select a valid warehouse.');
  if (!req.body.name?.trim() || !req.body.code?.trim()) {
    throw new ApiError(400, 'Location name and code are required.');
  }
  const location = await Location.create({
    name: req.body.name.trim(),
    code: req.body.code,
    warehouse: warehouse._id,
    notes: req.body.notes?.trim() || '',
    isActive: req.body.isActive !== false,
  });
  res.status(201).json({ success: true, message: 'Location created successfully.', data: location });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) throw new ApiError(404, 'Location not found.');
  if (req.body.name) location.name = req.body.name.trim();
  if (req.body.code) location.code = req.body.code;
  if (req.body.notes !== undefined) location.notes = req.body.notes.trim();
  if (req.body.isActive !== undefined) location.isActive = Boolean(req.body.isActive);
  await location.save();
  res.json({ success: true, message: 'Location updated successfully.', data: location });
});

export const listReorderRules = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.product) filter.product = req.query.product;
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  const [items, total] = await Promise.all([
    ReorderRule.find(filter)
      .populate('product', 'name sku unit')
      .populate('warehouse', 'name code')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    ReorderRule.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(page, limit, total) });
});

export const saveReorderRule = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.body.product);
  const warehouse = await Warehouse.findById(req.body.warehouse);
  if (!product || !warehouse) throw new ApiError(400, 'Select a product and warehouse.');
  const reorderLevel = Number(req.body.reorderLevel);
  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
    throw new ApiError(400, 'Reorder level cannot be negative.');
  }
  const rule = await ReorderRule.findOneAndUpdate(
    { product: product._id, warehouse: warehouse._id },
    { reorderLevel, isActive: req.body.isActive !== false },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).populate('product', 'name sku unit').populate('warehouse', 'name code');
  res.status(201).json({ success: true, message: 'Reorder rule saved.', data: rule });
});

export const deleteReorderRule = asyncHandler(async (req, res) => {
  const rule = await ReorderRule.findById(req.params.id);
  if (!rule) throw new ApiError(404, 'Reorder rule not found.');
  await rule.deleteOne();
  res.json({ success: true, message: 'Reorder rule deleted.' });
});

export const listLedger = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.warehouse) {
    filter.$or = [
      { warehouse: req.query.warehouse },
      { sourceWarehouse: req.query.warehouse },
      { destinationWarehouse: req.query.warehouse },
    ];
  }
  if (req.query.from || req.query.to) {
    filter.occurredAt = {};
    if (req.query.from) filter.occurredAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const end = new Date(req.query.to);
      end.setHours(23, 59, 59, 999);
      filter.occurredAt.$lte = end;
    }
  }
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    const search = [{ productName: rx }, { sku: rx }, { reference: rx }];
    filter.$and = [...(filter.$and || []), { $or: search }];
  }
  const [items, total] = await Promise.all([
    StockLedger.find(filter).sort({ occurredAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    StockLedger.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(page, limit, total) });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name role status').sort({ name: 1 });
  res.json({ success: true, data: users });
});

export const alerts = asyncHandler(async (req, res) => {
  const data = await getAlerts();
  res.json({ success: true, data });
});

export const locationStock = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.product) filter.product = req.query.product;
  if (req.query.location) filter.location = req.query.location;
  const levels = await StockLevel.find(filter).populate('product', 'name sku unit').populate('location', 'name code');
  res.json({ success: true, data: levels });
});
