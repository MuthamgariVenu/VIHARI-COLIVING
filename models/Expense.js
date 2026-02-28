import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  expenseId: { type: String, required: true, unique: true },
  branchId: { type: String, ref: 'Branch', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['SALARY', 'MAINTENANCE', 'UTILITY', 'FOOD', 'OTHER'], default: 'OTHER' },
  expenseDate: { type: Date, required: true },
  description: { type: String },
  addedBy: { type: String, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);