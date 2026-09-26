import mongoose from 'mongoose';
import Location from '../models/Location.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import StockLevel from '../models/StockLevel.js';
import Warehouse from '../models/Warehouse.js';
import { ApiError } from '../utils/ApiError.js';
import { MOVE_TYPES } from '../utils/constants.js';
import { roundQty } from '../utils/numbers.js';

export async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function companyQuantity(productId, session) {
  const rows = await StockLevel.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]).session(session);
  return roundQty(rows[0]?.total || 0);
}

export async function getLocationStock(productId, locationId, session) {
  const query = StockLevel.findOne({ product: productId, location: locationId });
  if (session) query.session(session);
  const level = await query;
  return roundQty(level?.quantity || 0);
}

export async function assertActiveLocation(warehouseId, locationId, session) {
  const locationQuery = Location.findById(locationId);
  const warehouseQuery = Warehouse.findById(warehouseId);
  if (session) {
    locationQuery.session(session);
    warehouseQuery.session(session);
  }
  const [location, warehouse] = await Promise.all([locationQuery, warehouseQuery]);
  if (!warehouse || !warehouse.isActive) {
    throw new ApiError(400, 'Warehouse is not available.');
  }
  if (!location || !location.isActive) {
    throw new ApiError(400, 'Location is not available.');
  }
  if (String(location.warehouse) !== String(warehouse._id)) {
    throw new ApiError(400, 'Location does not belong to the selected warehouse.');
  }
  return { location, warehouse };
}

export async function resolveProducts(items, session, quantityField = 'quantity') {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Add at least one product line.');
  }
  const seen = new Set();
  const resolved = [];
  for (const item of items) {
    const productQuery = Product.findById(item.product);
    if (session) productQuery.session(session);
    const product = await productQuery;
    if (!product || !product.isActive) {
      throw new ApiError(400, 'One or more products are unavailable.');
    }
    const key = String(product._id);
    if (seen.has(key)) {
      throw new ApiError(400, 'Each product can only appear once on a document.');
    }
    seen.add(key);
    const raw = item[quantityField];
    const quantity = roundQty(raw);
    if (!Number.isFinite(quantity) || quantity < 0 || (quantityField === 'quantity' && quantity <= 0)) {
      throw new ApiError(400, 'Enter a valid quantity greater than zero.');
    }
    if (quantityField === 'physicalCount' && quantity < 0) {
      throw new ApiError(400, 'Physical count cannot be negative.');
    }
    resolved.push({ product, quantity });
  }
  return resolved;
}

export async function increaseStock({ productId, warehouseId, locationId, quantity, session }) {
  const qty = roundQty(quantity);
  if (qty <= 0) throw new ApiError(400, 'Quantity must be greater than zero.');
  const level = await StockLevel.findOneAndUpdate(
    { product: productId, location: locationId },
    {
      $inc: { quantity: qty },
      $setOnInsert: {
        warehouse: warehouseId,
        product: productId,
        location: locationId,
      },
    },
    { returnDocument: 'after', upsert: true, session, setDefaultsOnInsert: true },
  );
  const current = roundQty(level.quantity);
  return { previous: roundQty(current - qty), current };
}

export async function decreaseStock({ productId, locationId, quantity, session }) {
  const qty = roundQty(quantity);
  if (qty <= 0) throw new ApiError(400, 'Quantity must be greater than zero.');
  const level = await StockLevel.findOneAndUpdate(
    { product: productId, location: locationId, quantity: { $gte: qty } },
    { $inc: { quantity: -qty } },
    { returnDocument: 'after', session },
  );
  if (!level) {
    throw new ApiError(400, 'Insufficient stock available.');
  }
  const current = roundQty(level.quantity);
  return { previous: roundQty(current + qty), current };
}

export async function setStock({ productId, warehouseId, locationId, quantity, session }) {
  const qty = roundQty(quantity);
  if (!Number.isFinite(qty) || qty < 0) {
    throw new ApiError(400, 'Stock cannot be negative.');
  }
  const previous = await getLocationStock(productId, locationId, session);
  const level = await StockLevel.findOneAndUpdate(
    { product: productId, location: locationId },
    {
      $set: { quantity: qty, warehouse: warehouseId },
      $setOnInsert: { product: productId, location: locationId },
    },
    { returnDocument: 'after', upsert: true, session, setDefaultsOnInsert: true },
  );
  return { previous, current: roundQty(level.quantity), difference: roundQty(qty - previous) };
}

async function writeLedger(entry, session) {
  const [doc] = await StockLedger.create([entry], { session });
  return doc;
}

function actor(user) {
  return { user: user._id, userName: user.name };
}

export async function applyReceiptLines({ document, user, session }) {
  const place = await assertActiveLocation(document.warehouse, document.location, session);
  const lines = await resolveProducts(document.items, session);
  for (const line of lines) {
    const companyPrevious = await companyQuantity(line.product._id, session);
    const moved = await increaseStock({
      productId: line.product._id,
      warehouseId: place.warehouse._id,
      locationId: place.location._id,
      quantity: line.quantity,
      session,
    });
    const companyNew = await companyQuantity(line.product._id, session);
    await writeLedger({
      product: line.product._id,
      sku: line.product.sku,
      productName: line.product.name,
      type: MOVE_TYPES.RECEIPT,
      reference: document.number,
      referenceId: document._id,
      referenceModel: 'Receipt',
      quantity: line.quantity,
      signedQuantity: line.quantity,
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
      ...actor(user),
      reason: `Incoming receipt ${document.number}`,
      occurredAt: document.date,
    }, session);
  }
}

export async function applyDeliveryLines({ document, user, session }) {
  const place = await assertActiveLocation(document.warehouse, document.location, session);
  const lines = await resolveProducts(document.items, session);
  for (const line of lines) {
    const companyPrevious = await companyQuantity(line.product._id, session);
    const moved = await decreaseStock({
      productId: line.product._id,
      locationId: place.location._id,
      quantity: line.quantity,
      session,
    });
    const companyNew = await companyQuantity(line.product._id, session);
    await writeLedger({
      product: line.product._id,
      sku: line.product.sku,
      productName: line.product.name,
      type: MOVE_TYPES.DELIVERY,
      reference: document.number,
      referenceId: document._id,
      referenceModel: 'Delivery',
      quantity: line.quantity,
      signedQuantity: -line.quantity,
      previousStock: moved.previous,
      newStock: moved.current,
      companyPrevious,
      companyNew,
      warehouse: place.warehouse._id,
      location: place.location._id,
      warehouseName: place.warehouse.name,
      locationName: place.location.name,
      sourceWarehouse: place.warehouse._id,
      sourceLocation: place.location._id,
      sourceWarehouseName: place.warehouse.name,
      sourceLocationName: place.location.name,
      sourcePrevious: moved.previous,
      sourceNew: moved.current,
      ...actor(user),
      reason: `Delivery ${document.number}`,
      occurredAt: document.date,
    }, session);
  }
}

export async function applyTransferLines({ document, user, session }) {
  if (String(document.sourceLocation) === String(document.destinationLocation)) {
    throw new ApiError(400, 'Source and destination locations must be different.');
  }
  const source = await assertActiveLocation(document.sourceWarehouse, document.sourceLocation, session);
  const destination = await assertActiveLocation(
    document.destinationWarehouse,
    document.destinationLocation,
    session,
  );
  const lines = await resolveProducts(document.items, session);
  for (const line of lines) {
    const companyPrevious = await companyQuantity(line.product._id, session);
    let sourceMove;
    try {
      sourceMove = await decreaseStock({
        productId: line.product._id,
        locationId: source.location._id,
        quantity: line.quantity,
        session,
      });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 400) {
        throw new ApiError(400, 'Insufficient stock at the source location.');
      }
      throw error;
    }
    const destinationMove = await increaseStock({
      productId: line.product._id,
      warehouseId: destination.warehouse._id,
      locationId: destination.location._id,
      quantity: line.quantity,
      session,
    });
    const companyNew = await companyQuantity(line.product._id, session);
    if (Math.abs(companyNew - companyPrevious) > 0.001) {
      throw new ApiError(500, 'Transfer changed total stock. The operation was rolled back.');
    }
    await writeLedger({
      product: line.product._id,
      sku: line.product.sku,
      productName: line.product.name,
      type: MOVE_TYPES.TRANSFER,
      reference: document.number,
      referenceId: document._id,
      referenceModel: 'Transfer',
      quantity: line.quantity,
      signedQuantity: 0,
      previousStock: sourceMove.previous,
      newStock: sourceMove.current,
      companyPrevious,
      companyNew,
      warehouse: source.warehouse._id,
      location: source.location._id,
      warehouseName: source.warehouse.name,
      locationName: source.location.name,
      sourceWarehouse: source.warehouse._id,
      sourceLocation: source.location._id,
      sourceWarehouseName: source.warehouse.name,
      sourceLocationName: source.location.name,
      sourcePrevious: sourceMove.previous,
      sourceNew: sourceMove.current,
      destinationWarehouse: destination.warehouse._id,
      destinationLocation: destination.location._id,
      destinationWarehouseName: destination.warehouse.name,
      destinationLocationName: destination.location.name,
      destinationPrevious: destinationMove.previous,
      destinationNew: destinationMove.current,
      ...actor(user),
      reason: `Internal transfer ${document.number}`,
      occurredAt: document.date,
    }, session);
  }
}

export async function applyAdjustmentLines({ document, user, session }) {
  const place = await assertActiveLocation(document.warehouse, document.location, session);
  const lines = await resolveProducts(document.items, session, 'physicalCount');
  const snapshots = [];
  for (const line of lines) {
    const companyPrevious = await companyQuantity(line.product._id, session);
    const moved = await setStock({
      productId: line.product._id,
      warehouseId: place.warehouse._id,
      locationId: place.location._id,
      quantity: line.quantity,
      session,
    });
    const companyNew = await companyQuantity(line.product._id, session);
    snapshots.push({
      product: line.product._id,
      unit: line.product.unit,
      physicalCount: line.quantity,
      systemQuantity: moved.previous,
      difference: moved.difference,
    });
    await writeLedger({
      product: line.product._id,
      sku: line.product.sku,
      productName: line.product.name,
      type: MOVE_TYPES.ADJUSTMENT,
      reference: document.number,
      referenceId: document._id,
      referenceModel: 'Adjustment',
      quantity: Math.abs(moved.difference),
      signedQuantity: moved.difference,
      previousStock: moved.previous,
      newStock: moved.current,
      companyPrevious,
      companyNew,
      warehouse: place.warehouse._id,
      location: place.location._id,
      warehouseName: place.warehouse.name,
      locationName: place.location.name,
      ...actor(user),
      reason: document.reason,
      occurredAt: document.date,
    }, session);
  }
  return snapshots;
}
