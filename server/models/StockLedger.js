import mongoose from 'mongoose';
import { MOVE_TYPES } from '../utils/constants.js';

const stockLedgerSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: Object.values(MOVE_TYPES), required: true, index: true },
    reference: { type: String, required: true, index: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceModel: { type: String, required: true },
    quantity: { type: Number, required: true },
    signedQuantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    companyPrevious: { type: Number, required: true },
    companyNew: { type: Number, required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    warehouseName: { type: String, default: '' },
    locationName: { type: String, default: '' },
    sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    sourceWarehouseName: { type: String, default: '' },
    sourceLocationName: { type: String, default: '' },
    sourcePrevious: { type: Number },
    sourceNew: { type: Number },
    destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    destinationWarehouseName: { type: String, default: '' },
    destinationLocationName: { type: String, default: '' },
    destinationPrevious: { type: Number },
    destinationNew: { type: Number },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, default: '' },
    reason: { type: String, default: '' },
    status: { type: String, default: 'done' },
    occurredAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

stockLedgerSchema.index({ occurredAt: -1, type: 1 });

export default mongoose.model('StockLedger', stockLedgerSchema);
