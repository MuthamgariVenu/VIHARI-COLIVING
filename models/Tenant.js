import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  userId: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  branchId: { type: String, ref: 'Branch', required: true },
  roomId: { type: String, ref: 'Room', required: true },
  bedId: { type: String, ref: 'Bed', required: true },
  joinDate: { type: Date, required: true },
  exitDate: { type: Date },
  monthlyRent: { type: Number, required: true },
  advanceAmount: { type: Number, default: 0 },
  refundableDeposit: { type: Number, default: 0 },
  nonRefundableDeposit: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  idProofFileName: { type: String },
  idProofPath: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'EXITED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);