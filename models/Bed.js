import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedId: { type: String, required: true, unique: true },
  roomId: { type: String, ref: 'Room', required: true },
  branchId: { type: String, ref: 'Branch', required: true },
  bedNumber: { type: String, required: true },
  isOccupied: { type: Boolean, default: false },
  currentTenantId: { type: String, ref: 'Tenant' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Bed || mongoose.model('Bed', bedSchema);