import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
    address: { type: String, trim: true, maxlength: 240, default: '' },
    contact: { type: String, trim: true, maxlength: 80, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.model('Warehouse', warehouseSchema);
