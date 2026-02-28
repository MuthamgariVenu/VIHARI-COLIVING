import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true, match: /^[0-9]{10}$/ },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'TENANT'], required: true },
  name: { type: String, required: true },
  branchId: { type: String, ref: 'Branch' },
  isActive: { type: Boolean, default: true },
  forcePasswordChange: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);