'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeeAPI, branchAPI } from '@/lib/api';
import { Plus, UsersRound, Phone, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    role: '',
    branchId: '',
    salary: '',
    joinDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, branchesData] = await Promise.all([
        employeeAPI.getAll(),
        branchAPI.getAll(),
      ]);
      setEmployees(employeesData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeeAPI.create({
        ...formData,
        salary: parseFloat(formData.salary),
      });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        mobile: '',
        role: '',
        branchId: '',
        salary: '',
        joinDate: new Date().toISOString().split('T')[0],
      });
      loadData();
      alert('Employee added successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const getBranchName = (branchId) => {
    return branches.find(b => b.branchId === branchId)?.name || 'Unknown';
  };

  return (
    <DashboardLayout role="ADMIN">
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
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Cook, Cleaner, Security"
                    required
                  />
                </div>
                <div>
                  <Label>Branch *</Label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.branchId} value={branch.branchId}>
                          {branch.name}
                        </SelectItem>
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
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="h-4 w-4" />
                          {getBranchName(employee.branchId)}
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