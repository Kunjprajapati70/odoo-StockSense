import mongoose from 'mongoose';

const reorderRuleSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    reorderLevel: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

reorderRuleSchema.index({ product: 1, warehouse: 1 }, { unique: true });

export default mongoose.model('ReorderRule', reorderRuleSchema);
