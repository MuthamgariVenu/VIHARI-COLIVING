'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeeAPI } from '@/lib/api';
import { Plus, UsersRound, Phone } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [userBranchId, setUserBranchId] = useState('');
  const [salaryError, setSalaryError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    role: '',
    salary: '',
    joinDate: new Date().toISOString().split('T')[0],
  });
  const [salaryData, setSalaryData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const employeeRoles = ['Cooker', 'Cleaner', 'Security'];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserBranchId(user.branchId || '');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const employeesData = await employeeAPI.getAll();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      alert('Please select a role');
      return;
    }
    try {
      await employeeAPI.create({
        ...formData,
        branchId: userBranchId,
        salary: parseFloat(formData.salary),
      });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        mobile: '',
        role: '',
        salary: '',
        joinDate: new Date().toISOString().split('T')[0],
      });
      loadData();
      alert('Employee added successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePaySalary = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    // Check 30-day restriction
    if (selectedEmployee.lastSalaryPaidDate) {
      const lastPaidDate = new Date(selectedEmployee.lastSalaryPaidDate);
      const daysSinceLastPayment = differenceInDays(new Date(), lastPaidDate);
      
      if (daysSinceLastPayment < 30) {
        const daysRemaining = 30 - daysSinceLastPayment;
        setSalaryError(`Salary already paid recently. Please wait ${daysRemaining} more day(s).`);
        return;
      }
    }
    
    try {
      await employeeAPI.paySalary(selectedEmployee.employeeId, {
        amount: parseFloat(salaryData.amount),
        date: salaryData.date,
      });
      setIsSalaryDialogOpen(false);
      setSelectedEmployee(null);
      setSalaryError('');
      setSalaryData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
      alert('Salary paid successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const openSalaryDialog = (employee) => {
    // Check 30-day restriction before opening dialog
    if (employee.lastSalaryPaidDate) {
      const lastPaidDate = new Date(employee.lastSalaryPaidDate);
      const daysSinceLastPayment = differenceInDays(new Date(), lastPaidDate);
      
      if (daysSinceLastPayment < 30) {
        const daysRemaining = 30 - daysSinceLastPayment;
        alert(`Salary already paid recently. Please wait ${daysRemaining} more day(s).`);
        return;
      }
    }
    
    setSelectedEmployee(employee);
    setSalaryError('');
    setSalaryData({
      amount: employee.salary.toString(),
      date: new Date().toISOString().split('T')[0],
    });
    setIsSalaryDialogOpen(true);
  };

  const canPaySalary = (employee) => {
    if (!employee.lastSalaryPaidDate) return true;
    const daysSinceLastPayment = differenceInDays(new Date(), new Date(employee.lastSalaryPaidDate));
    return daysSinceLastPayment >= 30;
  };

  const getDaysUntilNextPayment = (employee) => {
    if (!employee.lastSalaryPaidDate) return 0;
    const daysSinceLastPayment = differenceInDays(new Date(), new Date(employee.lastSalaryPaidDate));
    return Math.max(0, 30 - daysSinceLastPayment);
  };

  return (
    <DashboardLayout role="MANAGER">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Employees</h2>
            <p className="text-slate-600 mt-1">Manage hostel employees</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Mobile *</Label>
                  <Input
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    type="tel"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeRoles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Salary *</Label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Join Date *</Label>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Add Employee</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Salary Payment Dialog */}
        <Dialog open={isSalaryDialogOpen} onOpenChange={(open) => {
          setIsSalaryDialogOpen(open);
          if (!open) setSalaryError('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay Salary - {selectedEmployee?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePaySalary} className="space-y-4">
              {salaryError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{salaryError}</p>
                </div>
              )}
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={salaryData.amount}
                  onChange={(e) => setSalaryData({ ...salaryData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={salaryData.date}
                  onChange={(e) => setSalaryData({ ...salaryData, date: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Pay Salary</Button>
            </form>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <Card key={employee.employeeId} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xl">
                      {employee.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-800">{employee.name}</h3>
                      <p className="text-sm text-slate-600 mb-2">{employee.role}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4" />
                          {employee.mobile}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">Salary</p>
                          <p className="font-semibold text-green-600">₹{employee.salary.toLocaleString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {employee.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Joined: {format(new Date(employee.joinDate), 'MMM dd, yyyy')}
                      </p>
                      {employee.lastSalaryPaidDate && (
                        <p className="text-xs text-slate-500">
                          Last Paid: {format(new Date(employee.lastSalaryPaidDate), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {canPaySalary(employee) ? (
                        <Button
                          onClick={() => openSalaryDialog(employee)}
                          size="sm"
                          className="mt-3 w-full bg-green-600 hover:bg-green-700"
                        >
                          Pay Salary
                        </Button>
                      ) : (
                        <div className="mt-3">
                          <Button
                            disabled
                            size="sm"
                            className="w-full bg-gray-400 cursor-not-allowed"
                          >
                            Pay Salary
                          </Button>
                          <p className="text-xs text-orange-600 mt-1 text-center">
                            Wait {getDaysUntilNextPayment(employee)} day(s)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {employees.length === 0 && (
              <div className="col-span-full text-center py-12">
                <UsersRound className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No employees found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
