import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import StockLevel from '../models/StockLevel.js';
import { ApiError } from '../utils/ApiError.js';
import { MOVE_TYPES, STOCK_STATUS } from '../utils/constants.js';
import { escapeRegex, roundQty } from '../utils/numbers.js';
import { pageMeta, parsePage } from '../utils/pagination.js';
import { assertActiveLocation, companyQuantity, increaseStock, withTransaction } from './stockService.js';

function stockStatus(isActive, currentStock, reorderLevel) {
  if (!isActive) return STOCK_STATUS.INACTIVE;
  if (currentStock <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (currentStock <= reorderLevel) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

export async function listProducts(query) {
  const { page, limit, skip } = parsePage(query);
  const match = {};
  if (query.category) match.category = new mongoose.Types.ObjectId(String(query.category));
  if (query.active === 'true') match.isActive = true;
  if (query.active === 'false') match.isActive = false;
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    match.$or = [{ name: rx }, { sku: rx }];
  }

  const levelMatch = [{ $eq: ['$product', '$$productId'] }];
  if (query.warehouse) levelMatch.push({ $eq: ['$warehouse', new mongoose.Types.ObjectId(String(query.warehouse))] });
  if (query.location) levelMatch.push({ $eq: ['$location', new mongoose.Types.ObjectId(String(query.location))] });

  const sortMap = {
    name: 'name',
    sku: 'sku',
    stock: 'currentStock',
    date: 'createdAt',
  };
  const sortKey = sortMap[query.sort] || 'createdAt';
  const direction = query.direction === 'asc' ? 1 : query.sort ? -1 : -1;
  if (!query.sort) {
    // default newest first
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'stocklevels',
        let: { productId: '$_id' },
        pipeline: [{ $match: { $expr: { $and: levelMatch } } }],
        as: 'levels',
      },
    },
    { $addFields: { currentStock: { $round: [{ $sum: '$levels.quantity' }, 3] } } },
    {
      $addFields: {
        stockStatus: {
          $switch: {
            branches: [
              { case: { $eq: ['$isActive', false] }, then: STOCK_STATUS.INACTIVE },
              { case: { $lte: ['$currentStock', 0] }, then: STOCK_STATUS.OUT_OF_STOCK },
              { case: { $lte: ['$currentStock', '$reorderLevel'] }, then: STOCK_STATUS.LOW_STOCK },
            ],
            default: STOCK_STATUS.IN_STOCK,
          },
        },
      },
    },
  ];

  if (query.warehouse || query.location) {
    pipeline.push({ $match: { 'levels.0': { $exists: true } } });
  }
  if (query.stockStatus && query.stockStatus !== 'all') {
    pipeline.push({ $match: { stockStatus: query.stockStatus } });
  }

  pipeline.push({ $sort: { [sortKey]: query.sort ? direction : -1 } });
  pipeline.push({
    $facet: {
      items: [
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryDoc' } },
        { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            locationCount: { $size: '$levels' },
            primaryLevel: { $first: { $sortArray: { input: '$levels', sortBy: { quantity: -1 } } } },
          },
        },
        { $lookup: { from: 'warehouses', localField: 'primaryLevel.warehouse', foreignField: '_id', as: 'warehouseDoc' } },
        { $lookup: { from: 'locations', localField: 'primaryLevel.location', foreignField: '_id', as: 'locationDoc' } },
        {
          $project: {
            name: 1,
            sku: 1,
            unit: 1,
            reorderLevel: 1,
            description: 1,
            isActive: 1,
            currentStock: 1,
            stockStatus: 1,
            createdAt: 1,
            updatedAt: 1,
            locationCount: 1,
            warehouseName: { $ifNull: [{ $arrayElemAt: ['$warehouseDoc.name', 0] }, ''] },
            locationName: { $ifNull: [{ $arrayElemAt: ['$locationDoc.name', 0] }, ''] },
            category: { _id: '$categoryDoc._id', name: '$categoryDoc.name' },
          },
        },
      ],
      total: [{ $count: 'count' }],
    },
  });

  const [result] = await Product.aggregate(pipeline);
  const total = result?.total?.[0]?.count || 0;
  return { items: result?.items || [], meta: pageMeta(page, limit, total) };
}

export async function productOptions() {
  return Product.find({ isActive: true }).select('name sku unit reorderLevel').sort({ name: 1 }).limit(500);
}

export async function getProduct(id) {
  const product = await Product.findById(id).populate('category', 'name description');
  if (!product) throw new ApiError(404, 'Product not found.');
  const levels = await StockLevel.find({ product: id })
    .populate('warehouse', 'name code')
    .populate('location', 'name code')
    .sort({ quantity: -1 });
  const currentStock = roundQty(levels.reduce((sum, level) => sum + level.quantity, 0));
  const movements = await StockLedger.find({ product: id }).sort({ occurredAt: -1 }).limit(12);
  return {
    ...product.toObject(),
    currentStock,
    stockStatus: stockStatus(product.isActive, currentStock, product.reorderLevel),
    locations: levels,
    movements,
  };
}

export async function createProduct(payload, user) {
  const category = await Category.findById(payload.category);
  if (!category) throw new ApiError(400, 'Select a valid category.');
  const initialStock = roundQty(payload.initialStock || 0);
  if (!Number.isFinite(initialStock) || initialStock < 0) {
    throw new ApiError(400, 'Initial stock cannot be negative.');
  }
  if (initialStock > 0 && (!payload.warehouse || !payload.location)) {
    throw new ApiError(400, 'Choose a warehouse and location for the opening stock.');
  }
  const existing = await Product.findOne({ sku: String(payload.sku).toUpperCase() });
  if (existing) throw new ApiError(409, 'A product with this SKU already exists.');

  const product = await Product.create({
    name: payload.name.trim(),
    sku: payload.sku,
    category: category._id,
    unit: payload.unit,
    reorderLevel: roundQty(payload.reorderLevel || 0),
    description: payload.description?.trim() || '',
    isActive: payload.isActive !== false,
  });

  if (initialStock > 0) {
    await withTransaction(async (session) => {
      const place = await assertActiveLocation(payload.warehouse, payload.location, session);
      const companyPrevious = await companyQuantity(product._id, session);
      const moved = await increaseStock({
        productId: product._id,
        warehouseId: place.warehouse._id,
        locationId: place.location._id,
        quantity: initialStock,
        session,
      });
      const companyNew = await companyQuantity(product._id, session);
      await StockLedger.create([{
        product: product._id,
        sku: product.sku,
        productName: product.name,
        type: MOVE_TYPES.RECEIPT,
        reference: `OPEN-${product.sku}`,
        referenceId: product._id,
        referenceModel: 'Product',
        quantity: initialStock,
        signedQuantity: initialStock,
        previousStock: moved.previous,
        newStock: moved.current,
        companyPrevious,
        companyNew,
        warehouse: place.warehouse._id,
        location: place.location._id,
        warehouseName: place.warehouse.name,
        locationName: place.location.name,
        destinationWarehouse: place.warehouse._id,
        destinationLocation: place.location._id,
        destinationWarehouseName: place.warehouse.name,
        destinationLocationName: place.location.name,
        destinationPrevious: moved.previous,
        destinationNew: moved.current,
        user: user._id,
        userName: user.name,
        reason: 'Opening stock',
        occurredAt: new Date(),
      }], { session });
    });
  }

  return getProduct(product._id);
}

export async function updateProduct(id, payload) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (payload.category) {
    const category = await Category.findById(payload.category);
    if (!category) throw new ApiError(400, 'Select a valid category.');
    product.category = category._id;
  }
  if (payload.name) product.name = payload.name.trim();
  if (payload.sku) product.sku = payload.sku;
  if (payload.unit) product.unit = payload.unit;
  if (payload.reorderLevel !== undefined) {
    const level = roundQty(payload.reorderLevel);
    if (level < 0) throw new ApiError(400, 'Reorder level cannot be negative.');
    product.reorderLevel = level;
  }
  if (payload.description !== undefined) product.description = payload.description.trim();
  if (payload.isActive !== undefined) product.isActive = Boolean(payload.isActive);
  await product.save();
  return getProduct(product._id);
}

export async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found.');
  const [stock, ledger] = await Promise.all([
    StockLevel.countDocuments({ product: id, quantity: { $gt: 0 } }),
    StockLedger.countDocuments({ product: id }),
  ]);
  if (stock > 0 || ledger > 0) {
    throw new ApiError(400, 'This product has stock history. Deactivate it instead of deleting it.');
  }
  await product.deleteOne();
}
