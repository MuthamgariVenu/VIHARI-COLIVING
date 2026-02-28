import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  tenantId: { type: String, ref: 'Tenant', required: true },
  branchId: { type: String, ref: 'Branch', required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMode: { type: String, enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'], default: 'CASH' },
  month: { type: String },
  year: { type: Number },
  remarks: { type: String },
  addedBy: { type: String, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);