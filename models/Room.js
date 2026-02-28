import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  branchId: { type: String, ref: 'Branch', required: true },
  roomNumber: { type: String, required: true },
  floor: { type: Number },
  totalBeds: { type: Number, required: true },
  type: { type: String, enum: ['SHARED', 'PRIVATE'], default: 'SHARED' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Room || mongoose.model('Room', roomSchema);