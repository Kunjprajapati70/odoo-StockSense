import Adjustment from '../models/Adjustment.js';
import Delivery from '../models/Delivery.js';
import Receipt from '../models/Receipt.js';
import Transfer from '../models/Transfer.js';
import { ApiError } from '../utils/ApiError.js';
import { DOC_STATUS, OPEN_STATUSES } from '../utils/constants.js';
import { escapeRegex } from '../utils/numbers.js';
import { pageMeta, parsePage } from '../utils/pagination.js';
import { nextNumber } from './sequenceService.js';
import {
  applyAdjustmentLines,
  applyDeliveryLines,
  applyReceiptLines,
  applyTransferLines,
  assertActiveLocation,
  resolveProducts,
  withTransaction,
} from './stockService.js';

const TRANSITIONS = {
  [DOC_STATUS.DRAFT]: [DOC_STATUS.WAITING, DOC_STATUS.READY, DOC_STATUS.CANCELED],
  [DOC_STATUS.WAITING]: [DOC_STATUS.READY, DOC_STATUS.CANCELED],
  [DOC_STATUS.READY]: [DOC_STATUS.CANCELED],
  [DOC_STATUS.DONE]: [],
  [DOC_STATUS.CANCELED]: [],
};

async function prepareLines(items, session) {
  const resolved = await resolveProducts(items, session);
  return resolved.map((line) => ({
    product: line.product._id,
    quantity: line.quantity,
    unit: line.product.unit,
  }));
}

async function prepareAdjustmentLines(items, session) {
  const resolved = await resolveProducts(items, session, 'physicalCount');
  return resolved.map((line) => ({
    product: line.product._id,
    physicalCount: line.quantity,
    systemQuantity: 0,
    difference: 0,
    unit: line.product.unit,
  }));
}

function listQuery(query, searchFields) {
  const { page, limit, skip } = parsePage(query);
  const filter = {};
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = searchFields.map((field) => ({ [field]: rx }));
  }
  const sortField = ['date', 'number', 'status', 'createdAt'].includes(query.sort) ? query.sort : 'date';
  const direction = query.direction === 'asc' ? 1 : -1;
  return { page, limit, skip, filter, sort: { [sortField]: direction } };
}

async function paginate(Model, query, searchFields, populate) {
  const { page, limit, skip, filter, sort } = listQuery(query, searchFields);
  const [items, total] = await Promise.all([
    Model.find(filter).sort(sort).skip(skip).limit(limit).populate(populate),
    Model.countDocuments(filter),
  ]);
  return { items, meta: pageMeta(page, limit, total) };
}

const docPopulate = [
  { path: 'warehouse', select: 'name code' },
  { path: 'location', select: 'name code warehouse' },
  { path: 'items.product', select: 'name sku unit' },
  { path: 'createdBy', select: 'name role' },
  { path: 'validatedBy', select: 'name role' },
];

const transferPopulate = [
  { path: 'sourceWarehouse', select: 'name code' },
  { path: 'sourceLocation', select: 'name code' },
  { path: 'destinationWarehouse', select: 'name code' },
  { path: 'destinationLocation', select: 'name code' },
  { path: 'items.product', select: 'name sku unit' },
  { path: 'createdBy', select: 'name role' },
  { path: 'validatedBy', select: 'name role' },
];

function assertOpen(doc, label) {
  if (!doc) throw new ApiError(404, `${label} not found.`);
  if (!OPEN_STATUSES.includes(doc.status)) {
    throw new ApiError(400, `Only open ${label.toLowerCase()}s can be changed.`);
  }
}

function applyStatus(doc, status) {
  if (!status || status === doc.status) return;
  if (status === DOC_STATUS.DONE) {
    throw new ApiError(400, 'Use validate to complete this document.');
  }
  if (!TRANSITIONS[doc.status]?.includes(status)) {
    throw new ApiError(400, `Cannot move this document from ${doc.status} to ${status}.`);
  }
  doc.status = status;
}

async function load(Model, id, populate, label) {
  const doc = await Model.findById(id).populate(populate);
  if (!doc) throw new ApiError(404, `${label} not found.`);
  return doc;
}

export async function listReceipts(query) {
  const filterQuery = { ...query };
  if (query.warehouse) filterQuery.warehouse = query.warehouse;
  return paginate(Receipt, filterQuery, ['number', 'supplier', 'notes'], docPopulate);
}

export async function getReceipt(id) {
  return load(Receipt, id, docPopulate, 'Receipt');
}

export async function createReceipt(payload, user) {
  await assertActiveLocation(payload.warehouse, payload.location);
  const items = await prepareLines(payload.items);
  const number = await nextNumber('receipt', 'RCP');
  const doc = await Receipt.create({
    number,
    supplier: payload.supplier?.trim(),
    warehouse: payload.warehouse,
    location: payload.location,
    items,
    date: payload.date ? new Date(payload.date) : new Date(),
    notes: payload.notes?.trim() || '',
    createdBy: user._id,
  });
  return getReceipt(doc._id);
}

export async function updateReceipt(id, payload, user) {
  const doc = await Receipt.findById(id);
  assertOpen(doc, 'Receipt');
  if (payload.warehouse || payload.location) {
    await assertActiveLocation(payload.warehouse || doc.warehouse, payload.location || doc.location);
  }
  if (payload.supplier) doc.supplier = payload.supplier.trim();
  if (payload.warehouse) doc.warehouse = payload.warehouse;
  if (payload.location) doc.location = payload.location;
  if (payload.items) doc.items = await prepareLines(payload.items);
  if (payload.date) doc.date = new Date(payload.date);
  if (payload.notes !== undefined) doc.notes = payload.notes.trim();
  applyStatus(doc, payload.status);
  doc.updatedBy = user._id;
  await doc.save();
  return getReceipt(doc._id);
}

export async function validateReceipt(id, user) {
  return withTransaction(async (session) => {
    const doc = await Receipt.findById(id).session(session);
    assertOpen(doc, 'Receipt');
    await applyReceiptLines({ document: doc, user, session });
    doc.status = DOC_STATUS.DONE;
    doc.validatedBy = user._id;
    doc.validatedAt = new Date();
    await doc.save({ session });
    return doc._id;
  }).then((savedId) => getReceipt(savedId));
}

export async function cancelReceipt(id) {
  const doc = await Receipt.findById(id);
  assertOpen(doc, 'Receipt');
  doc.status = DOC_STATUS.CANCELED;
  await doc.save();
  return getReceipt(doc._id);
}

export async function listDeliveries(query) {
  return paginate(Delivery, query, ['number', 'customer', 'notes'], docPopulate);
}

export async function getDelivery(id) {
  return load(Delivery, id, docPopulate, 'Delivery');
}

export async function createDelivery(payload, user) {
  await assertActiveLocation(payload.warehouse, payload.location);
  const items = await prepareLines(payload.items);
  const number = await nextNumber('delivery', 'DLV');
  const doc = await Delivery.create({
    number,
    customer: payload.customer?.trim(),
    warehouse: payload.warehouse,
    location: payload.location,
    items,
    date: payload.date ? new Date(payload.date) : new Date(),
    notes: payload.notes?.trim() || '',
    createdBy: user._id,
  });
  return getDelivery(doc._id);
}

export async function updateDelivery(id, payload) {
  const doc = await Delivery.findById(id);
  assertOpen(doc, 'Delivery');
  if (payload.warehouse || payload.location) {
    await assertActiveLocation(payload.warehouse || doc.warehouse, payload.location || doc.location);
  }
  if (payload.customer) doc.customer = payload.customer.trim();
  if (payload.warehouse) doc.warehouse = payload.warehouse;
  if (payload.location) doc.location = payload.location;
  if (payload.items) doc.items = await prepareLines(payload.items);
  if (payload.date) doc.date = new Date(payload.date);
  if (payload.notes !== undefined) doc.notes = payload.notes.trim();
  applyStatus(doc, payload.status);
  await doc.save();
  return getDelivery(doc._id);
}

export async function validateDelivery(id, user) {
  return withTransaction(async (session) => {
    const doc = await Delivery.findById(id).session(session);
    assertOpen(doc, 'Delivery');
    await applyDeliveryLines({ document: doc, user, session });
    doc.status = DOC_STATUS.DONE;
    doc.validatedBy = user._id;
    doc.validatedAt = new Date();
    await doc.save({ session });
    return doc._id;
  }).then((savedId) => getDelivery(savedId));
}

export async function cancelDelivery(id) {
  const doc = await Delivery.findById(id);
  assertOpen(doc, 'Delivery');
  doc.status = DOC_STATUS.CANCELED;
  await doc.save();
  return getDelivery(doc._id);
}

export async function listTransfers(query) {
  const mapped = { ...query };
  if (query.warehouse) {
    mapped.warehouse = undefined;
  }
  const { page, limit, skip, filter, sort } = listQuery(mapped, ['number', 'notes']);
  if (query.warehouse) {
    filter.$or = [
      ...(filter.$or || []),
      { sourceWarehouse: query.warehouse },
      { destinationWarehouse: query.warehouse },
    ];
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      filter.$and = [
        { $or: [{ number: rx }, { notes: rx }] },
        { $or: [{ sourceWarehouse: query.warehouse }, { destinationWarehouse: query.warehouse }] },
      ];
      delete filter.$or;
    }
  }
  const [items, total] = await Promise.all([
    Transfer.find(filter).sort(sort).skip(skip).limit(limit).populate(transferPopulate),
    Transfer.countDocuments(filter),
  ]);
  return { items, meta: pageMeta(page, limit, total) };
}

export async function getTransfer(id) {
  return load(Transfer, id, transferPopulate, 'Transfer');
}

export async function createTransfer(payload, user) {
  if (String(payload.sourceLocation) === String(payload.destinationLocation)) {
    throw new ApiError(400, 'Source and destination locations must be different.');
  }
  await assertActiveLocation(payload.sourceWarehouse, payload.sourceLocation);
  await assertActiveLocation(payload.destinationWarehouse, payload.destinationLocation);
  const items = await prepareLines(payload.items);
  const number = await nextNumber('transfer', 'TRF');
  const doc = await Transfer.create({
    number,
    sourceWarehouse: payload.sourceWarehouse,
    sourceLocation: payload.sourceLocation,
    destinationWarehouse: payload.destinationWarehouse,
    destinationLocation: payload.destinationLocation,
    items,
    date: payload.date ? new Date(payload.date) : new Date(),
    notes: payload.notes?.trim() || '',
    createdBy: user._id,
  });
  return getTransfer(doc._id);
}

export async function updateTransfer(id, payload) {
  const doc = await Transfer.findById(id);
  assertOpen(doc, 'Transfer');
  const sourceWarehouse = payload.sourceWarehouse || doc.sourceWarehouse;
  const sourceLocation = payload.sourceLocation || doc.sourceLocation;
  const destinationWarehouse = payload.destinationWarehouse || doc.destinationWarehouse;
  const destinationLocation = payload.destinationLocation || doc.destinationLocation;
  if (String(sourceLocation) === String(destinationLocation)) {
    throw new ApiError(400, 'Source and destination locations must be different.');
  }
  await assertActiveLocation(sourceWarehouse, sourceLocation);
  await assertActiveLocation(destinationWarehouse, destinationLocation);
  doc.sourceWarehouse = sourceWarehouse;
  doc.sourceLocation = sourceLocation;
  doc.destinationWarehouse = destinationWarehouse;
  doc.destinationLocation = destinationLocation;
  if (payload.items) doc.items = await prepareLines(payload.items);
  if (payload.date) doc.date = new Date(payload.date);
  if (payload.notes !== undefined) doc.notes = payload.notes.trim();
  applyStatus(doc, payload.status);
  await doc.save();
  return getTransfer(doc._id);
}

export async function validateTransfer(id, user) {
  return withTransaction(async (session) => {
    const doc = await Transfer.findById(id).session(session);
    assertOpen(doc, 'Transfer');
    await applyTransferLines({ document: doc, user, session });
    doc.status = DOC_STATUS.DONE;
    doc.validatedBy = user._id;
    doc.validatedAt = new Date();
    await doc.save({ session });
    return doc._id;
  }).then((savedId) => getTransfer(savedId));
}

export async function cancelTransfer(id) {
  const doc = await Transfer.findById(id);
  assertOpen(doc, 'Transfer');
  doc.status = DOC_STATUS.CANCELED;
  await doc.save();
  return getTransfer(doc._id);
}

const adjustmentPopulate = docPopulate;

export async function listAdjustments(query) {
  return paginate(Adjustment, query, ['number', 'reason', 'notes'], adjustmentPopulate);
}

export async function getAdjustment(id) {
  return load(Adjustment, id, adjustmentPopulate, 'Adjustment');
}

export async function createAdjustment(payload, user) {
  await assertActiveLocation(payload.warehouse, payload.location);
  const items = await prepareAdjustmentLines(payload.items);
  const number = await nextNumber('adjustment', 'ADJ');
  const doc = await Adjustment.create({
    number,
    warehouse: payload.warehouse,
    location: payload.location,
    items,
    reason: payload.reason?.trim(),
    date: payload.date ? new Date(payload.date) : new Date(),
    notes: payload.notes?.trim() || '',
    createdBy: user._id,
  });
  return getAdjustment(doc._id);
}

export async function updateAdjustment(id, payload) {
  const doc = await Adjustment.findById(id);
  assertOpen(doc, 'Adjustment');
  if (payload.warehouse || payload.location) {
    await assertActiveLocation(payload.warehouse || doc.warehouse, payload.location || doc.location);
  }
  if (payload.warehouse) doc.warehouse = payload.warehouse;
  if (payload.location) doc.location = payload.location;
  if (payload.reason) doc.reason = payload.reason.trim();
  if (payload.items) doc.items = await prepareAdjustmentLines(payload.items);
  if (payload.date) doc.date = new Date(payload.date);
  if (payload.notes !== undefined) doc.notes = payload.notes.trim();
  await doc.save();
  return getAdjustment(doc._id);
}

export async function validateAdjustment(id, user) {
  return withTransaction(async (session) => {
    const doc = await Adjustment.findById(id).session(session);
    assertOpen(doc, 'Adjustment');
    const snapshots = await applyAdjustmentLines({ document: doc, user, session });
    doc.items = snapshots;
    doc.status = DOC_STATUS.DONE;
    doc.validatedBy = user._id;
    doc.validatedAt = new Date();
    await doc.save({ session });
    return doc._id;
  }).then((savedId) => getAdjustment(savedId));
}

export async function cancelAdjustment(id) {
  const doc = await Adjustment.findById(id);
  assertOpen(doc, 'Adjustment');
  doc.status = DOC_STATUS.CANCELED;
  await doc.save();
  return getAdjustment(doc._id);
}
