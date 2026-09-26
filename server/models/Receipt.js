import mongoose from 'mongoose';
import { DOC_STATUS } from '../utils/constants.js';
import { lineItemSchema } from './lineItems.js';

const receiptSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    supplier: { type: String, required: true, trim: true, maxlength: 140 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
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

export default mongoose.model('Receipt', receiptSchema);
