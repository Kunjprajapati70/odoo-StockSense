import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, trim: true, maxlength: 240, default: '' },
  },
  { timestamps: true },
);

locationSchema.index({ warehouse: 1, code: 1 }, { unique: true });

export default mongoose.model('Location', locationSchema);
