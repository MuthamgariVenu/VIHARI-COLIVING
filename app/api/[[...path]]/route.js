import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { generateToken, authenticateRequest } from '@/lib/auth';
import seedDefaultAdmin from '@/lib/seedAdmin';

// Models
import User from '@/models/User';
import Branch from '@/models/Branch';
import Room from '@/models/Room';
import Bed from '@/models/Bed';
import Tenant from '@/models/Tenant';
import Payment from '@/models/Payment';
import Expense from '@/models/Expense';
import Employee from '@/models/Employee';
import Complaint from '@/models/Complaint';
import ExitRequest from '@/models/ExitRequest';
import BranchDetails from '@/models/BranchDetails';
import Backup from '@/models/Backup';

// Seed admin on server start
seedDefaultAdmin();

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }));
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    await connectDB();

    // ============= PUBLIC ROUTES =============
    
    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hostel ERP API" }));
    }

    // Login endpoint - POST /api/auth/login
    if (route === '/auth/login' && method === 'POST') {
      const { mobile, password, role } = await request.json();

      if (!mobile || !password || !role) {
        return handleCORS(NextResponse.json({ error: 'Mobile, password and role required' }, { status: 400 }));
      }

      // Validate mobile format
      if (!/^[0-9]{10}$/.test(mobile)) {
        return handleCORS(NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 }));
      }

      // Convert role to uppercase for case-insensitive matching
      const normalizedRole = role.toUpperCase();
      const user = await User.findOne({ mobile, role: normalizedRole, isActive: true });
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }));
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }));
      }

      const token = generateToken({
        userId: user.userId,
        mobile: user.mobile,
        role: user.role,
        name: user.name,
        branchId: user.branchId
      });

      return handleCORS(NextResponse.json({
        token,
        user: {
          userId: user.userId,
          mobile: user.mobile,
          role: user.role,
          name: user.name,
          branchId: user.branchId,
          forcePasswordChange: user.forcePasswordChange
        }
      }));
    }

    // GET /api/branches - Public access for landing page
    if (route === '/branches' && method === 'GET') {
      // Allow public access without authentication for landing page
      const branches = await Branch.find({ status: 'ACTIVE' }).select('-_id -__v');
      return handleCORS(NextResponse.json(branches));
    }

    // GET /api/rooms - Public access for branch details page
    if (route === '/rooms' && method === 'GET') {
      const rooms = await Room.find({ status: 'ACTIVE' }).select('-_id -__v');
      return handleCORS(NextResponse.json(rooms));
    }

    // GET /api/beds - Public access for branch details page
    if (route === '/beds' && method === 'GET') {
      const beds = await Bed.find({ status: 'ACTIVE' }).select('-_id -__v');
      return handleCORS(NextResponse.json(beds));
    }

    // ============= BRANCH DETAILS ROUTES (PUBLIC) =============

    // GET /api/branch-details - Get all branch details (public)
    if (route === '/branch-details' && method === 'GET') {
      const branchDetails = await BranchDetails.find({}).lean();
      return handleCORS(NextResponse.json(branchDetails.map(bd => ({
        ...bd,
        _id: undefined
      }))));
    }

    // GET /api/branch-details/:branchId - Get branch details by branchId (public)
    if (route.startsWith('/branch-details/') && method === 'GET' && path.length === 2) {
      const branchId = path[1];
      
      // Get branch details
      let branchDetails = await BranchDetails.findOne({ branchId }).lean();
      
      // Auto-calculate stats from rooms and beds
      const rooms = await Room.find({ branchId, status: 'ACTIVE' });
      const beds = await Bed.find({ branchId, status: 'ACTIVE' });
      const availableBeds = beds.filter(b => !b.isOccupied).length;
      
      const stats = {
        totalRooms: rooms.length,
        totalBeds: beds.length,
        availableBeds: availableBeds
      };
      
      if (!branchDetails) {
        // Return default with auto-calculated stats
        return handleCORS(NextResponse.json({
          branchId,
          facilities: [],
          food: { breakfast: [], lunch: [], dinner: [] },
          rent: { single: 0, double: 0, triple: 0 },
          stats
        }));
      }
      
      // Update stats in response
      branchDetails.stats = stats;
      delete branchDetails._id;
      
      return handleCORS(NextResponse.json(branchDetails));
    }

    // POST /api/auth/change-password - Change password
    if (route === '/auth/change-password' && method === 'POST') {
      const auth = await authenticateRequest(request);
      if (!auth.authenticated) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const { oldPassword, newPassword } = await request.json();
      
      if (!oldPassword || !newPassword) {
        return handleCORS(NextResponse.json({ error: 'Old password and new password required' }, { status: 400 }));
      }

      if (newPassword.length < 4) {
        return handleCORS(NextResponse.json({ error: 'New password must be at least 4 characters' }, { status: 400 }));
      }

      const user = await User.findOne({ userId: auth.user.userId });
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }));
      }

      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return handleCORS(NextResponse.json({ error: 'Old password is incorrect' }, { status: 400 }));
      }

      user.password = newPassword;
      user.forcePasswordChange = false;
      await user.save();

      return handleCORS(NextResponse.json({ message: 'Password changed successfully' }));
    }

    // POST /api/auth/reset-password - Admin reset password (Admin only)
    if (route === '/auth/reset-password' && method === 'POST') {
      const auth = await authenticateRequest(request);
      if (!auth.authenticated || auth.user.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const { userId } = await request.json();
      
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'User ID required' }, { status: 400 }));
      }

      const user = await User.findOne({ userId, role: { $in: ['MANAGER', 'TENANT'] } });
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }));
      }

      // Set password to last 4 digits of mobile
      const newPassword = user.mobile.slice(-4);
      user.password = newPassword;
      user.forcePasswordChange = true;
      await user.save();

      return handleCORS(NextResponse.json({ message: 'Password reset successfully', mobile: user.mobile }));
    }

    // ============= PROTECTED ROUTES =============
    
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return handleCORS(NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 }));
    }

    const currentUser = auth.user;

    // ============= BRANCH ROUTES =============
    
    // POST /api/branches - Create branch (Admin only)
    if (route === '/branches' && method === 'POST') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const body = await request.json();
      const branch = new Branch({
        branchId: uuidv4(),
        ...body
      });

      await branch.save();
      return handleCORS(NextResponse.json({ success: true, branchId: branch.branchId }));
    }

    // PUT /api/branches/:id - Update branch
    if (route.startsWith('/branches/') && method === 'PUT') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const branchId = path[1];
      const body = await request.json();
      
      await Branch.findOneAndUpdate({ branchId }, body);
      return handleCORS(NextResponse.json({ success: true }));
    }

    // ============= ROOM ROUTES =============
    
    // POST /api/rooms - Create room
    if (route === '/rooms' && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const body = await request.json();
      
      // Validate duplicate room number in same branch
      const existingRoom = await Room.findOne({ 
        roomNumber: body.roomNumber, 
        branchId: body.branchId,
        status: 'ACTIVE'
      });
      
      if (existingRoom) {
        return handleCORS(NextResponse.json({ 
          error: `Room ${body.roomNumber} already exists in this branch` 
        }, { status: 400 }));
      }
      
      const roomId = uuidv4();
      const room = new Room({
        roomId,
        ...body
      });

      await room.save();
      
      // Auto-generate beds based on totalBeds
      const totalBeds = parseInt(body.totalBeds) || 0;
      if (totalBeds > 0) {
        const bedPromises = [];
        for (let i = 1; i <= totalBeds; i++) {
          const bed = new Bed({
            bedId: uuidv4(),
            roomId: roomId,
            branchId: body.branchId,
            bedNumber: i.toString(),
            isOccupied: false,
            status: 'ACTIVE'
          });
          bedPromises.push(bed.save());
        }
        await Promise.all(bedPromises);
      }
      
      return handleCORS(NextResponse.json({ success: true, roomId: room.roomId, bedsCreated: totalBeds }));
    }

    // ============= BED ROUTES =============
    
    // POST /api/beds - Create bed
    if (route === '/beds' && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const body = await request.json();
      const bed = new Bed({
        bedId: uuidv4(),
        ...body
      });

      await bed.save();
      return handleCORS(NextResponse.json({ success: true, bedId: bed.bedId }));
    }

    // ============= MANAGER ROUTES =============
    
    // GET /api/managers - Get all managers
    if (route === '/managers' && method === 'GET') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const managers = await User.find({ role: 'MANAGER' }).select('-_id -__v -password');
      return handleCORS(NextResponse.json(managers));
    }

    // POST /api/managers - Create manager (Admin only)
    if (route === '/managers' && method === 'POST') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const { name, mobile, branchId } = await request.json();

      if (!/^[0-9]{10}$/.test(mobile)) {
        return handleCORS(NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 }));
      }

      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'Mobile already exists' }, { status: 400 }));
      }

      const password = mobile.slice(-4);
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        userId: uuidv4(),
        mobile,
        password: hashedPassword,
        role: 'MANAGER',
        name,
        branchId,
        forcePasswordChange: true
      });

      await user.save();

      // Update branch manager
      if (branchId) {
        await Branch.findOneAndUpdate({ branchId }, { managerId: user.userId });
      }

      return handleCORS(NextResponse.json({ success: true, userId: user.userId }));
    }

    // PUT /api/managers/:userId - Update manager (Admin only)
    if (route.startsWith('/managers/') && method === 'PUT') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const userId = path[1];
      const { name, mobile, branchId } = await request.json();

      const manager = await User.findOne({ userId, role: 'MANAGER' });
      if (!manager) {
        return handleCORS(NextResponse.json({ error: 'Manager not found' }, { status: 404 }));
      }

      // Check if mobile is being changed and if it already exists
      if (mobile && mobile !== manager.mobile) {
        if (!/^[0-9]{10}$/.test(mobile)) {
          return handleCORS(NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 }));
        }
        const existingUser = await User.findOne({ mobile, userId: { $ne: userId } });
        if (existingUser) {
          return handleCORS(NextResponse.json({ error: 'Mobile already exists' }, { status: 400 }));
        }
      }

      // Update old branch to remove manager
      if (manager.branchId && manager.branchId !== branchId) {
        await Branch.findOneAndUpdate({ branchId: manager.branchId }, { managerId: null });
      }

      // Update manager
      await User.findOneAndUpdate(
        { userId },
        { name, mobile, branchId, updatedAt: new Date() }
      );

      // Update new branch with manager
      if (branchId) {
        await Branch.findOneAndUpdate({ branchId }, { managerId: userId });
      }

      return handleCORS(NextResponse.json({ success: true }));
    }

    // DELETE /api/managers/:userId - Delete manager (Admin only)
    if (route.startsWith('/managers/') && method === 'DELETE') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const userId = path[1];

      const manager = await User.findOne({ userId, role: 'MANAGER' });
      if (!manager) {
        return handleCORS(NextResponse.json({ error: 'Manager not found' }, { status: 404 }));
      }

      // Remove manager from branch
      if (manager.branchId) {
        await Branch.findOneAndUpdate({ branchId: manager.branchId }, { managerId: null });
      }

      // Delete manager
      await User.deleteOne({ userId });

      return handleCORS(NextResponse.json({ success: true }));
    }

    // ============= TENANT ROUTES =============
    
    // GET /api/tenants - Get all tenants
    if (route === '/tenants' && method === 'GET') {
      let query = {};
      if (currentUser.role === 'MANAGER') {
        query.branchId = currentUser.branchId;
      } else if (currentUser.role === 'TENANT') {
        query.userId = currentUser.userId;
      }

      const tenants = await Tenant.find(query).select('-_id -__v');
      return handleCORS(NextResponse.json(tenants));
    }

    // POST /api/upload/idproof - Upload ID proof file
    if (route === '/upload/idproof' && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const mobile = formData.get('mobile');

        if (!file) {
          return handleCORS(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }));
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          return handleCORS(NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, PDF' }, { status: 400 }));
        }

        // Get file extension
        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `tenant_${mobile}_${Date.now()}.${ext}`;
        
        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'idproof');
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        return handleCORS(NextResponse.json({ 
          success: true, 
          fileName,
          filePath: `/uploads/idproof/${fileName}`
        }));
      } catch (error) {
        console.error('Upload error:', error);
        return handleCORS(NextResponse.json({ error: 'File upload failed' }, { status: 500 }));
      }
    }

    // POST /api/tenants - Create tenant (Admin/Manager only)
    if (route === '/tenants' && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const body = await request.json();
      const { name, mobile, branchId, roomId, bedId, joinDate, monthlyRent, advanceAmount, refundableDeposit, nonRefundableDeposit, idProofFileName, idProofPath } = body;

      if (!/^[0-9]{10}$/.test(mobile)) {
        return handleCORS(NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 }));
      }

      // Check if bed is available
      const bed = await Bed.findOne({ bedId });
      if (!bed || bed.isOccupied) {
        return handleCORS(NextResponse.json({ error: 'Bed not available' }, { status: 400 }));
      }

      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'Mobile already exists' }, { status: 400 }));
      }

      // Create user account
      const password = mobile.slice(-4);
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        userId: uuidv4(),
        mobile,
        password: hashedPassword,
        role: 'TENANT',
        name,
        branchId,
        forcePasswordChange: true
      });

      await user.save();

      // Create tenant record
      const tenant = new Tenant({
        tenantId: uuidv4(),
        userId: user.userId,
        name,
        mobile,
        branchId,
        roomId,
        bedId,
        joinDate,
        monthlyRent,
        advanceAmount: advanceAmount || 0,
        refundableDeposit: refundableDeposit || 0,
        nonRefundableDeposit: nonRefundableDeposit || 0,
        totalPaid: 0,
        idProofFileName: idProofFileName || null,
        idProofPath: idProofPath || null
      });

      await tenant.save();

      // Update bed occupancy
      await Bed.findOneAndUpdate(
        { bedId },
        { isOccupied: true, currentTenantId: tenant.tenantId }
      );

      return handleCORS(NextResponse.json({ success: true, tenantId: tenant.tenantId }));
    }

    // ============= PAYMENT ROUTES =============
    
    // GET /api/payments - Get all payments
    if (route === '/payments' && method === 'GET') {
      let query = {};
      if (currentUser.role === 'MANAGER') {
        query.branchId = currentUser.branchId;
      } else if (currentUser.role === 'TENANT') {
        const tenant = await Tenant.findOne({ userId: currentUser.userId });
        if (tenant) query.tenantId = tenant.tenantId;
      }

      const payments = await Payment.find(query).select('-_id -__v').sort({ paymentDate: -1 });
      return handleCORS(NextResponse.json(payments));
    }

    // POST /api/payments - Add payment
    if (route === '/payments' && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const body = await request.json();
      const { tenantId, amount, paymentDate, paymentMode, month, year, remarks } = body;

      const tenant = await Tenant.findOne({ tenantId });
      if (!tenant) {
        return handleCORS(NextResponse.json({ error: 'Tenant not found' }, { status: 404 }));
      }

      const payment = new Payment({
        paymentId: uuidv4(),
        tenantId,
        branchId: tenant.branchId,
        amount,
        paymentDate,
        paymentMode: paymentMode || 'CASH',
        month,
        year,
        remarks,
        addedBy: currentUser.userId
      });

      await payment.save();

      // Update tenant total paid
      await Tenant.findOneAndUpdate(
        { tenantId },
        { $inc: { totalPaid: amount } }
      );

      return handleCORS(NextResponse.json({ success: true, paymentId: payment.paymentId }));
    }

    // ============= EXPENSE ROUTES =============
    
    // GET /api/expenses - Get all expenses
    if (route === '/expenses' && method === 'GET') {
      let query = {};
      if (currentUser.role === 'MANAGER') {
        query.branchId = currentUser.branchId;
      } else if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const expenses = await Expense.find(query).select('-_id -__v').sort({ expenseDate: -1 });
      return handleCORS(NextResponse.json(expenses));
    }

    // POST /api/expenses - Add expense
    if (route === '/expenses' && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const body = await request.json();
      const expense = new Expense({
        expenseId: uuidv4(),
        ...body,
        addedBy: currentUser.userId
      });

      await expense.save();
      return handleCORS(NextResponse.json({ success: true, expenseId: expense.expenseId }));
    }

    // ============= EMPLOYEE ROUTES =============
    
    // GET /api/employees - Get all employees
    if (route === '/employees' && method === 'GET') {
      let query = {};
      if (currentUser.role === 'MANAGER') {
        query.branchId = currentUser.branchId;
      } else if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const employees = await Employee.find(query).select('-_id -__v');
      return handleCORS(NextResponse.json(employees));
    }

    // POST /api/employees - Add employee
    if (route === '/employees' && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const body = await request.json();
      const employee = new Employee({
        employeeId: uuidv4(),
        ...body
      });

      await employee.save();
      return handleCORS(NextResponse.json({ success: true, employeeId: employee.employeeId }));
    }

    // POST /api/employees/:id/pay-salary - Pay employee salary
    if (route.startsWith('/employees/') && route.endsWith('/pay-salary') && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const employeeId = path[1];
      const employee = await Employee.findOne({ employeeId });
      
      if (!employee) {
        return handleCORS(NextResponse.json({ error: 'Employee not found' }, { status: 404 }));
      }

      const body = await request.json();
      const { amount, date } = body;

      // Create expense entry for salary payment
      const expense = new Expense({
        expenseId: uuidv4(),
        branchId: employee.branchId,
        title: `Salary - ${employee.name}`,
        amount,
        category: 'SALARY',
        expenseDate: date || new Date(),
        description: `Salary payment for ${employee.role}`,
        addedBy: currentUser.userId
      });

      await expense.save();

      // Update employee last salary paid date
      await Employee.findOneAndUpdate(
        { employeeId },
        { lastSalaryPaidDate: date || new Date() }
      );

      return handleCORS(NextResponse.json({ success: true }));
    }

    // ============= COMPLAINT ROUTES =============
    
    // GET /api/complaints - Get all complaints
    if (route === '/complaints' && method === 'GET') {
      let query = {};
      if (currentUser.role === 'MANAGER') {
        query.branchId = currentUser.branchId;
      } else if (currentUser.role === 'TENANT') {
        const tenant = await Tenant.findOne({ userId: currentUser.userId });
        if (tenant) query.tenantId = tenant.tenantId;
      }

      const complaints = await Complaint.find(query).select('-_id -__v').sort({ createdAt: -1 });
      return handleCORS(NextResponse.json(complaints));
    }

    // POST /api/complaints - Create complaint (Tenant only)
    if (route === '/complaints' && method === 'POST') {
      if (currentUser.role !== 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Tenant access required' }, { status: 403 }));
      }

      const tenant = await Tenant.findOne({ userId: currentUser.userId });
      if (!tenant) {
        return handleCORS(NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 }));
      }

      const body = await request.json();
      const complaint = new Complaint({
        complaintId: uuidv4(),
        tenantId: tenant.tenantId,
        branchId: tenant.branchId,
        ...body
      });

      await complaint.save();
      return handleCORS(NextResponse.json({ success: true, complaintId: complaint.complaintId }));
    }

    // PUT /api/complaints/:id - Update complaint status
    if (route.startsWith('/complaints/') && method === 'PUT') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const complaintId = path[1];
      const body = await request.json();

      await Complaint.findOneAndUpdate(
        { complaintId },
        { ...body, updatedAt: new Date() }
      );

      return handleCORS(NextResponse.json({ success: true }));
    }

    // ============= EXIT REQUEST ROUTES =============
    
    // GET /api/exit-requests - Get all exit requests
    if (route === '/exit-requests' && method === 'GET') {
      let query = {};
      if (currentUser.role === 'MANAGER') {
        query.branchId = currentUser.branchId;
      } else if (currentUser.role === 'TENANT') {
        const tenant = await Tenant.findOne({ userId: currentUser.userId });
        if (tenant) query.tenantId = tenant.tenantId;
      }

      const exitRequests = await ExitRequest.find(query).select('-_id -__v').sort({ createdAt: -1 });
      return handleCORS(NextResponse.json(exitRequests));
    }

    // POST /api/exit-requests - Create exit request (Tenant only)
    if (route === '/exit-requests' && method === 'POST') {
      if (currentUser.role !== 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Tenant access required' }, { status: 403 }));
      }

      const tenant = await Tenant.findOne({ userId: currentUser.userId });
      if (!tenant) {
        return handleCORS(NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 }));
      }

      const body = await request.json();
      const exitRequest = new ExitRequest({
        exitRequestId: uuidv4(),
        tenantId: tenant.tenantId,
        branchId: tenant.branchId,
        ...body
      });

      await exitRequest.save();
      return handleCORS(NextResponse.json({ success: true, exitRequestId: exitRequest.exitRequestId }));
    }

    // PUT /api/exit-requests/:id - Update exit request
    if (route.startsWith('/exit-requests/') && method === 'PUT') {
      const exitRequestId = path[1];
      const body = await request.json();

      await ExitRequest.findOneAndUpdate(
        { exitRequestId },
        { ...body, updatedAt: new Date() }
      );

      return handleCORS(NextResponse.json({ success: true }));
    }

    // POST /api/exit-requests/:id/complete - Complete exit process
    if (route.startsWith('/exit-requests/') && route.endsWith('/complete') && method === 'POST') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      const exitRequestId = path[1];
      const exitRequest = await ExitRequest.findOne({ exitRequestId });

      if (!exitRequest) {
        return handleCORS(NextResponse.json({ error: 'Exit request not found' }, { status: 404 }));
      }

      const tenant = await Tenant.findOne({ tenantId: exitRequest.tenantId });
      if (!tenant) {
        return handleCORS(NextResponse.json({ error: 'Tenant not found' }, { status: 404 }));
      }

      // Calculate refund
      const refundAmount = exitRequest.finalAmount || tenant.refundableDeposit;

      // Create refund expense entry
      if (refundAmount > 0) {
        const expense = new Expense({
          expenseId: uuidv4(),
          branchId: tenant.branchId,
          title: `Refund - ${tenant.name}`,
          amount: refundAmount,
          category: 'OTHER',
          expenseDate: new Date(),
          description: 'Deposit refund on exit',
          addedBy: currentUser.userId
        });

        await expense.save();
      }

      // Update tenant status
      await Tenant.findOneAndUpdate(
        { tenantId: tenant.tenantId },
        { status: 'EXITED', exitDate: new Date() }
      );

      // Free the bed
      await Bed.findOneAndUpdate(
        { bedId: tenant.bedId },
        { isOccupied: false, currentTenantId: null }
      );

      // Make user inactive
      await User.findOneAndUpdate(
        { userId: tenant.userId },
        { isActive: false }
      );

      // Update exit request status
      await ExitRequest.findOneAndUpdate(
        { exitRequestId },
        { status: 'COMPLETED', updatedAt: new Date() }
      );

      return handleCORS(NextResponse.json({ success: true }));
    }

    // ============= DASHBOARD ROUTES =============
    
    // GET /api/dashboard/admin - Admin dashboard stats
    if (route === '/dashboard/admin' && method === 'GET') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const totalBranches = await Branch.countDocuments({ status: 'ACTIVE' });
      const totalTenants = await Tenant.countDocuments({ status: 'ACTIVE' });
      const totalRooms = await Room.countDocuments({ status: 'ACTIVE' });
      const totalBeds = await Bed.countDocuments({ status: 'ACTIVE' });
      const occupiedBeds = await Bed.countDocuments({ isOccupied: true, status: 'ACTIVE' });
      const availableBeds = totalBeds - occupiedBeds;

      const payments = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const revenue = payments[0]?.total || 0;

      const expenses = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalExpenses = expenses[0]?.total || 0;

      const netBalance = revenue - totalExpenses;

      // Recent activities
      const recentTenants = await Tenant.find().sort({ createdAt: -1 }).limit(5).select('-_id -__v');
      const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5).select('-_id -__v');
      const recentExpenses = await Expense.find().sort({ createdAt: -1 }).limit(5).select('-_id -__v');
      const recentComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(5).select('-_id -__v');

      return handleCORS(NextResponse.json({
        stats: {
          totalBranches,
          totalTenants,
          totalRooms,
          totalBeds,
          occupiedBeds,
          availableBeds,
          revenue,
          expenses: totalExpenses,
          netBalance
        },
        recentActivities: {
          tenants: recentTenants,
          payments: recentPayments,
          expenses: recentExpenses,
          complaints: recentComplaints
        }
      }));
    }

    // GET /api/dashboard/manager - Manager dashboard stats
    if (route === '/dashboard/manager' && method === 'GET') {
      if (currentUser.role !== 'MANAGER') {
        return handleCORS(NextResponse.json({ error: 'Manager access required' }, { status: 403 }));
      }

      const branchId = currentUser.branchId;

      const totalTenants = await Tenant.countDocuments({ branchId, status: 'ACTIVE' });
      const totalBeds = await Bed.countDocuments({ branchId, status: 'ACTIVE' });
      const occupiedBeds = await Bed.countDocuments({ branchId, isOccupied: true, status: 'ACTIVE' });
      const availableBeds = totalBeds - occupiedBeds;

      const payments = await Payment.aggregate([
        { $match: { branchId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const revenue = payments[0]?.total || 0;

      const expenses = await Expense.aggregate([
        { $match: { branchId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalExpenses = expenses[0]?.total || 0;

      const balance = revenue - totalExpenses;

      // Recent activities
      const recentTenants = await Tenant.find({ branchId }).sort({ createdAt: -1 }).limit(5).select('-_id -__v');
      const recentPayments = await Payment.find({ branchId }).sort({ createdAt: -1 }).limit(5).select('-_id -__v');
      const recentComplaints = await Complaint.find({ branchId }).sort({ createdAt: -1 }).limit(5).select('-_id -__v');

      return handleCORS(NextResponse.json({
        stats: {
          totalTenants,
          totalBeds,
          occupiedBeds,
          availableBeds,
          revenue,
          expenses: totalExpenses,
          balance
        },
        recentActivities: {
          tenants: recentTenants,
          payments: recentPayments,
          complaints: recentComplaints
        }
      }));
    }

    // GET /api/dashboard/tenant - Tenant dashboard
    if (route === '/dashboard/tenant' && method === 'GET') {
      if (currentUser.role !== 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Tenant access required' }, { status: 403 }));
      }

      const tenant = await Tenant.findOne({ userId: currentUser.userId }).select('-_id -__v');
      if (!tenant) {
        return handleCORS(NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 }));
      }

      const payments = await Payment.find({ tenantId: tenant.tenantId }).sort({ paymentDate: -1 }).select('-_id -__v');
      const complaints = await Complaint.find({ tenantId: tenant.tenantId }).sort({ createdAt: -1 }).select('-_id -__v');

      return handleCORS(NextResponse.json({
        profile: tenant,
        payments,
        complaints
      }));
    }

    // GET /api/alerts - Get alerts
    if (route === '/alerts' && method === 'GET') {
      if (currentUser.role === 'TENANT') {
        return handleCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
      }

      let branchFilter = {};
      if (currentUser.role === 'MANAGER') {
        branchFilter.branchId = currentUser.branchId;
      }

      // Pending complaints
      const pendingComplaints = await Complaint.find({
        ...branchFilter,
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      }).select('-_id -__v');

      // Pending exit requests
      const pendingExits = await ExitRequest.find({
        ...branchFilter,
        status: { $in: ['PENDING', 'MANAGER_APPROVED'] }
      }).select('-_id -__v');

      return handleCORS(NextResponse.json({
        pendingComplaints,
        pendingExits,
        count: pendingComplaints.length + pendingExits.length
      }));
    }

    // ============= BACKUP ROUTES =============
    
    // POST /api/backup/create - Create database backup
    if (route === '/backup/create' && method === 'POST') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const fs = require('fs');
      const pathModule = require('path');
      const archiver = require('archiver');

      // Fetch all data
      const users = await User.find().select('-password -_id -__v');
      const branches = await Branch.find().select('-_id -__v');
      const rooms = await Room.find().select('-_id -__v');
      const beds = await Bed.find().select('-_id -__v');
      const tenants = await Tenant.find().select('-_id -__v');
      const payments = await Payment.find().select('-_id -__v');
      const expenses = await Expense.find().select('-_id -__v');
      const employees = await Employee.find().select('-_id -__v');
      const complaints = await Complaint.find().select('-_id -__v');
      const exitRequests = await ExitRequest.find().select('-_id -__v');

      const backup = {
        createdAt: new Date().toISOString(),
        version: '1.0',
        data: {
          users,
          branches,
          rooms,
          beds,
          tenants,
          payments,
          expenses,
          employees,
          complaints,
          exitRequests
        }
      };

      const timestamp = `${new Date().toISOString().split('T')[0]}-${Date.now()}`;
      const backupDir = pathModule.join(process.cwd(), 'backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Write database JSON
      const jsonFileName = `database-${timestamp}.json`;
      const jsonPath = pathModule.join(backupDir, jsonFileName);
      fs.writeFileSync(jsonPath, JSON.stringify(backup, null, 2));

      // Create ZIP file with database and uploads
      const zipFileName = `backup-${timestamp}.zip`;
      const zipPath = pathModule.join(backupDir, zipFileName);
      const uploadsDir = pathModule.join(process.cwd(), 'public', 'uploads');

      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);

        archive.pipe(output);
        
        // Add database JSON
        archive.file(jsonPath, { name: 'database.json' });
        
        // Add uploads folder if exists
        if (fs.existsSync(uploadsDir)) {
          archive.directory(uploadsDir, 'uploads');
        }

        archive.finalize();
      });

      // Remove temp JSON file
      fs.unlinkSync(jsonPath);

      // Get file size
      const fileStats = fs.statSync(zipPath);

      // Store backup record in MongoDB
      const now = new Date();
      const backupRecord = new Backup({
        backupId: `BKP-${Date.now()}`,
        fileName: zipFileName,
        backupDate: now.toISOString().split('T')[0],
        backupTime: now.toTimeString().split(' ')[0],
        size: fileStats.size,
        status: 'COMPLETED',
        collections: ['users', 'branches', 'rooms', 'beds', 'tenants', 'payments', 'expenses', 'employees', 'complaints', 'exitRequests']
      });
      await backupRecord.save();

      return handleCORS(NextResponse.json({ 
        success: true, 
        fileName: zipFileName,
        backupId: backupRecord.backupId,
        backupDate: backupRecord.backupDate,
        backupTime: backupRecord.backupTime,
        message: 'Backup created successfully (includes database + uploads)'
      }));
    }

    // GET /api/backup/list - List all backups
    if (route === '/backup/list' && method === 'GET') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      // Get backup history from MongoDB
      const backups = await Backup.find().sort({ createdAt: -1 }).select('-_id -__v');
      return handleCORS(NextResponse.json(backups));
    }

    // GET /api/backup/download/:filename - Download backup file
    if (route.startsWith('/backup/download/') && method === 'GET') {
      if (currentUser.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }));
      }

      const fs = require('fs');
      const pathModule = require('path');

      const fileName = path[2];
      const filePath = pathModule.join(process.cwd(), 'backups', fileName);

      if (!fs.existsSync(filePath)) {
        return handleCORS(NextResponse.json({ error: 'Backup file not found' }, { status: 404 }));
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
        },
      });
    }

    // ============= BRANCH DETAILS ROUTES =============

    // GET /api/branch-details - Get all branch details (public)
    if (route === '/branch-details' && method === 'GET') {
      const branchDetails = await BranchDetails.find({}).lean();
      return handleCORS(NextResponse.json(branchDetails.map(bd => ({
        ...bd,
        _id: undefined
      }))));
    }

    // GET /api/branch-details/:branchId - Get branch details by branchId (public)
    if (route.startsWith('/branch-details/') && method === 'GET' && path.length === 2) {
      const branchId = path[1];
      
      // Get branch details
      let branchDetails = await BranchDetails.findOne({ branchId }).lean();
      
      // Auto-calculate stats from rooms and beds
      const rooms = await Room.find({ branchId, status: 'ACTIVE' });
      const beds = await Bed.find({ branchId, status: 'ACTIVE' });
      const availableBeds = beds.filter(b => !b.isOccupied).length;
      
      const stats = {
        totalRooms: rooms.length,
        totalBeds: beds.length,
        availableBeds: availableBeds
      };
      
      if (!branchDetails) {
        // Return default with auto-calculated stats
        return handleCORS(NextResponse.json({
          branchId,
          facilities: [],
          food: { breakfast: [], lunch: [], dinner: [] },
          rent: { single: 0, double: 0, triple: 0 },
          stats
        }));
      }
      
      // Update stats in response
      branchDetails.stats = stats;
      delete branchDetails._id;
      
      return handleCORS(NextResponse.json(branchDetails));
    }

    // POST /api/branch-details - Create/Update branch details (Manager only)
    if (route === '/branch-details' && method === 'POST') {
      const auth = await authenticateRequest(request);
      if (!auth.authenticated) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }
      
      if (auth.user.role !== 'MANAGER' && auth.user.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Manager access required' }, { status: 403 }));
      }
      
      const { branchId, facilities, food, rent, showStatsOnLanding } = await request.json();
      
      if (!branchId) {
        return handleCORS(NextResponse.json({ error: 'Branch ID required' }, { status: 400 }));
      }
      
      // Auto-calculate stats
      const rooms = await Room.find({ branchId, status: 'ACTIVE' });
      const beds = await Bed.find({ branchId, status: 'ACTIVE' });
      const availableBeds = beds.filter(b => !b.isOccupied).length;
      
      const stats = {
        totalRooms: rooms.length,
        totalBeds: beds.length,
        availableBeds: availableBeds
      };
      
      // Upsert branch details
      const branchDetails = await BranchDetails.findOneAndUpdate(
        { branchId },
        {
          $set: {
            branchId,
            facilities: facilities || [],
            food: food || { breakfast: [], lunch: [], dinner: [] },
            rent: rent || { single: 0, double: 0, triple: 0 },
            stats,
            showStatsOnLanding: showStatsOnLanding !== undefined ? showStatsOnLanding : true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      const response = branchDetails.toObject();
      delete response._id;
      
      return handleCORS(NextResponse.json(response));
    }

    // PUT /api/branch-details/:branchId - Update branch details (Manager only)
    if (route.startsWith('/branch-details/') && method === 'PUT') {
      const auth = await authenticateRequest(request);
      if (!auth.authenticated) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }
      
      if (auth.user.role !== 'MANAGER' && auth.user.role !== 'ADMIN') {
        return handleCORS(NextResponse.json({ error: 'Manager access required' }, { status: 403 }));
      }
      
      const branchId = path[1];
      const { facilities, food, rent, showStatsOnLanding } = await request.json();
      
      // Auto-calculate stats
      const rooms = await Room.find({ branchId, status: 'ACTIVE' });
      const beds = await Bed.find({ branchId, status: 'ACTIVE' });
      const availableBeds = beds.filter(b => !b.isOccupied).length;
      
      const stats = {
        totalRooms: rooms.length,
        totalBeds: beds.length,
        availableBeds: availableBeds
      };
      
      const branchDetails = await BranchDetails.findOneAndUpdate(
        { branchId },
        {
          $set: {
            facilities,
            food,
            rent,
            stats,
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      const response = branchDetails.toObject();
      delete response._id;
      
      return handleCORS(NextResponse.json(response));
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }));

  } catch (error) {
    console.error('API Error:', error);
    return handleCORS(NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 }));
  }
}

// Export all HTTP methods
export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;
