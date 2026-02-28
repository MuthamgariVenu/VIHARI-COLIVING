# Hostel Management ERP System

A production-ready, full-stack Hostel Management System built with Next.js, MongoDB, and modern UI components.

## Features

### Multi-Role System
- **Admin**: Full system access, manage branches, managers, and view all operations
- **Manager**: Branch-specific access, manage tenants, payments, and operations
- **Tenant**: Personal dashboard, view payments, raise complaints, request exit

### Core Modules

#### 1. Branch Management
- Create and manage multiple hostel branches
- Track branch details, facilities, and contact information
- Assign managers to branches

#### 2. Room & Bed Management
- Create rooms with multiple beds
- Track bed occupancy in real-time
- Automatic bed allocation and release

#### 3. Manager Management
- Create manager accounts with branch assignment
- Auto-generated credentials (last 4 digits of mobile)
- Branch-specific access control

#### 4. Tenant Management
- Complete tenant lifecycle management
- Bed assignment with availability checking
- Track rent, deposits, and payments
- Automatic user account creation

#### 5. Payment Tracking
- Record tenant payments
- Track payment history
- Automatic balance calculation
- Multiple payment modes (Cash, UPI, Bank Transfer, Card)

#### 6. Expense Management
- Track branch expenses
- Categories: Salary, Maintenance, Utility, Food, Other
- Revenue and expense reporting

#### 7. Employee Management
- Manage branch employees
- Track salaries and payments
- Automatic expense entry on salary payment

#### 8. Complaint System
- Tenants can raise complaints
- Managers can update status and resolve
- Priority levels and status tracking

#### 9. Exit Process
- Tenant-initiated exit requests
- Multi-level approval workflow
- Automatic refund calculation
- Bed release on exit completion

#### 10. Alerts & Notifications
- Pending complaints
- Exit requests requiring action
- Real-time dashboard updates

### Dashboard Features

#### Admin Dashboard
- Total branches, tenants, rooms, and beds
- Occupancy statistics
- Revenue, expenses, and net balance
- Recent activities across all branches

#### Manager Dashboard
- Branch-specific statistics
- Tenant and bed occupancy
- Revenue and expense tracking
- Recent activities for assigned branch

#### Tenant Dashboard
- Personal profile and payment status
- Payment history
- Complaint tracking
- Exit request status

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **UI Components**: Radix UI, Lucide Icons

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- Yarn package manager

### Setup

1. Clone the repository
```bash
cd /app
```

2. Install dependencies
```bash
yarn install
```

3. Configure environment variables
```bash
# .env file is already configured with:
MONGO_URL=mongodb://localhost:27017
DB_NAME=hostel_erp
JWT_SECRET=hostel-erp-secret-key-2024-production
NEXT_PUBLIC_BASE_URL=https://hostel-erp-2.preview.emergentagent.com
CORS_ORIGINS=*
```

4. Start the development server
```bash
yarn dev
```

5. Access the application
```
http://localhost:3000
```

## Default Credentials

### Admin Login
- **Mobile**: 9999999999
- **Password**: 9999
- **Role**: Admin

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with mobile, password, and role

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create new branch (Admin only)
- `PUT /api/branches/:id` - Update branch (Admin only)

### Rooms & Beds
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room
- `GET /api/beds` - Get all beds
- `POST /api/beds` - Create bed

### Managers
- `GET /api/managers` - Get all managers (Admin only)
- `POST /api/managers` - Create manager (Admin only)

### Tenants
- `GET /api/tenants` - Get tenants
- `POST /api/tenants` - Create tenant

### Payments
- `GET /api/payments` - Get payments
- `POST /api/payments` - Add payment

### Expenses
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Add expense

### Employees
- `GET /api/employees` - Get employees
- `POST /api/employees` - Add employee
- `POST /api/employees/:id/pay-salary` - Pay employee salary

### Complaints
- `GET /api/complaints` - Get complaints
- `POST /api/complaints` - Create complaint (Tenant)
- `PUT /api/complaints/:id` - Update complaint status

### Exit Requests
- `GET /api/exit-requests` - Get exit requests
- `POST /api/exit-requests` - Create exit request (Tenant)
- `PUT /api/exit-requests/:id` - Update exit request
- `POST /api/exit-requests/:id/complete` - Complete exit process

### Dashboards
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/manager` - Manager dashboard stats
- `GET /api/dashboard/tenant` - Tenant dashboard data

### Alerts
- `GET /api/alerts` - Get pending alerts

## User Workflows

### Admin Workflow
1. Login with admin credentials
2. Create branches
3. Create rooms and beds for each branch
4. Create managers and assign to branches
5. Monitor overall system performance
6. View reports and analytics

### Manager Workflow
1. Login with manager credentials
2. Create tenant accounts
3. Assign tenants to available beds
4. Record payments
5. Manage expenses
6. Handle complaints
7. Process exit requests

### Tenant Workflow
1. Login with tenant credentials
2. View personal dashboard
3. Check payment history
4. Raise complaints
5. Request exit when needed

## Key Features

### Real-Time Synchronization
- All modules are fully synchronized
- Bed occupancy updates automatically
- Dashboard reflects real-time changes
- Cross-module data consistency

### Role-Based Access Control
- Admins see all data
- Managers see only their branch data
- Tenants see only their personal data

### Responsive Design
- Desktop: Fixed sidebar navigation
- Mobile: Drawer-based navigation
- Fully responsive tables and cards
- Touch-friendly interface

### Professional UI
- Gradient backgrounds
- Soft color schemes
- Card-based layouts
- Smooth animations
- Beautiful typography

## Database Schema

### Users Collection
- userId, mobile, password, role, name, branchId, isActive

### Branches Collection
- branchId, name, code, address, city, phone, managerId, status, facilities

### Rooms Collection
- roomId, branchId, roomNumber, floor, totalBeds, type, status

### Beds Collection
- bedId, roomId, branchId, bedNumber, isOccupied, currentTenantId, status

### Tenants Collection
- tenantId, userId, name, mobile, branchId, roomId, bedId, joinDate, monthlyRent, deposits, totalPaid, status

### Payments Collection
- paymentId, tenantId, branchId, amount, paymentDate, paymentMode, month, year

### Expenses Collection
- expenseId, branchId, title, amount, category, expenseDate, description

### Employees Collection
- employeeId, name, mobile, role, branchId, salary, joinDate, status

### Complaints Collection
- complaintId, tenantId, branchId, title, description, status, priority

### Exit Requests Collection
- exitRequestId, tenantId, branchId, expectedExitDate, status, refundAmount

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Protected API routes
- Mobile number validation
- Secure token storage

## Development Notes

- Hot reload enabled for fast development
- MongoDB connection pooling
- Optimized queries with Mongoose
- Clean code architecture
- Reusable UI components
- Type-safe with proper validation

## Future Enhancements

- Email notifications
- SMS integration
- Payment gateway integration
- Advanced reporting and analytics
- Document upload for tenants
- QR code for payments
- Mobile app support

## Support

For issues or questions, please refer to the API documentation or contact the development team.

## License

Proprietary - All rights reserved
