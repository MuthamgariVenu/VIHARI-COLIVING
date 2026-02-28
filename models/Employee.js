import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  role: { type: String, required: true },
  branchId: { type: String, ref: 'Branch', required: true },
  salary: { type: Number, required: true },
  joinDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  lastSalaryPaidDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Employee || mongoose.model('Employee', employeeSchema);