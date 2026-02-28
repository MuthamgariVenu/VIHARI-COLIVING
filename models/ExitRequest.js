import mongoose from 'mongoose';

const exitRequestSchema = new mongoose.Schema({
  exitRequestId: { type: String, required: true, unique: true },
  tenantId: { type: String, ref: 'Tenant', required: true },
  branchId: { type: String, ref: 'Branch', required: true },
  requestDate: { type: Date, default: Date.now },
  expectedExitDate: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, enum: ['PENDING', 'MANAGER_APPROVED', 'ADMIN_APPROVED', 'COMPLETED', 'REJECTED'], default: 'PENDING' },
  refundAmount: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.ExitRequest || mongoose.model('ExitRequest', exitRequestSchema);