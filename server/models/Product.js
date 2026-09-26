import mongoose from 'mongoose';
import { UNITS } from '../utils/constants.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    unit: { type: String, required: true, enum: UNITS },
    reorderLevel: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.model('Product', productSchema);
