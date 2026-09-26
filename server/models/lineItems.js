import mongoose from 'mongoose';

export const lineItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: String, required: true, trim: true },
  },
  { _id: false },
);

export const adjustmentItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    physicalCount: { type: Number, required: true, min: 0 },
    systemQuantity: { type: Number, default: 0, min: 0 },
    difference: { type: Number, default: 0 },
    unit: { type: String, required: true, trim: true },
  },
  { _id: false },
);
