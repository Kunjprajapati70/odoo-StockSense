import mongoose from 'mongoose';

const stockLevelSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

stockLevelSchema.index({ product: 1, location: 1 }, { unique: true });

export default mongoose.model('StockLevel', stockLevelSchema);
