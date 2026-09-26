import mongoose from 'mongoose';
import { DOC_STATUS } from '../utils/constants.js';
import { lineItemSchema } from './lineItems.js';

const transferSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    items: { type: [lineItemSchema], validate: [(value) => value.length > 0, 'Add at least one product.'] },
    date: { type: Date, required: true, index: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: Object.values(DOC_STATUS), default: DOC_STATUS.DRAFT, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model('Transfer', transferSchema);
