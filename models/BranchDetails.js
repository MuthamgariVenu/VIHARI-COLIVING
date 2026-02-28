import mongoose from 'mongoose';

const branchDetailsSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true },
  facilities: [{ type: String }],
  food: {
    breakfast: [{ type: String }],
    lunch: [{ type: String }],
    dinner: [{ type: String }]
  },
  rent: {
    single: { type: Number, default: 0 },
    double: { type: Number, default: 0 },
    triple: { type: Number, default: 0 }
  },
  stats: {
    totalRooms: { type: Number, default: 0 },
    totalBeds: { type: Number, default: 0 },
    availableBeds: { type: Number, default: 0 }
  },
  showStatsOnLanding: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.BranchDetails || mongoose.model('BranchDetails', branchDetailsSchema);
