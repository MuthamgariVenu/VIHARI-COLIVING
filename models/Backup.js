import mongoose from 'mongoose';

const backupSchema = new mongoose.Schema({
  backupId: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  backupDate: { type: String, required: true },
  backupTime: { type: String, required: true },
  size: { type: Number, default: 0 },
  status: { type: String, enum: ['COMPLETED', 'FAILED'], default: 'COMPLETED' },
  collections: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Backup || mongoose.model('Backup', backupSchema);
