import connectDB from './mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedDefaultAdmin() {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ mobile: '9999999999' });
    if (existingAdmin) {
      console.log('✓ Default admin already exists');
      return;
    }

    // Create default admin (password will be hashed by pre-save hook)
    const admin = new User({
      userId: uuidv4(),
      mobile: '9999999999',
      password: '9999',
      role: 'ADMIN',
      name: 'System Admin',
      isActive: true,
      forcePasswordChange: false
    });

    await admin.save();
    console.log('✓ Default admin created successfully (Mobile: 9999999999, Password: 9999)');
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

export default seedDefaultAdmin;