import mongoose from 'mongoose';
import { DOC_STATUS } from '../utils/constants.js';
import { adjustmentItemSchema } from './lineItems.js';

const adjustmentSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    items: {
      type: [adjustmentItemSchema],
      validate: [(value) => value.length > 0, 'Add at least one product.'],
    },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    date: { type: Date, required: true, index: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: [DOC_STATUS.DRAFT, DOC_STATUS.DONE, DOC_STATUS.CANCELED],
      default: DOC_STATUS.DRAFT,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model('Adjustment', adjustmentSchema);
