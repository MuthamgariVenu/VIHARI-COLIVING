import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: { type: String, required: true },
  whatsappNumber: { type: String },
  managerId: { type: String, ref: 'User' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  coverImage: { type: String },
  facilities: [{ type: String }],
  foodDetails: { type: String },
  foodMenu: {
    breakfast: [{ type: String }],
    lunch: [{ type: String }],
    dinner: [{ type: String }]
  },
  rentDetails: {
    singleSharing: { type: Number },
    doubleSharing: { type: Number },
    tripleSharing: { type: Number }
  },
  googleMapLink: { type: String },
  mapCoordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  gallery: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Branch || mongoose.model('Branch', branchSchema);