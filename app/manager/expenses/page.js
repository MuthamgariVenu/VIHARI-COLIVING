'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseAPI } from '@/lib/api';
import { Plus, Wallet } from 'lucide-react';
import { format } from 'date-fns';

export default function ManagerExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userBranchId, setUserBranchId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'OTHER',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserBranchId(user.branchId || '');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const expensesData = await expenseAPI.getAll();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.create({
        ...formData,
        branchId: userBranchId,
        amount: parseFloat(formData.amount),
      });
      setIsDialogOpen(false);
      setFormData({
        title: '',
        amount: '',
        category: 'OTHER',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
      });
      loadData();
      alert('Expense recorded successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <DashboardLayout role="MANAGER">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Expenses</h2>
            <p className="text-slate-600 mt-1">Track branch expenses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALARY">Salary</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="FOOD">Food</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Record Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Card key={expense.expenseId}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg text-slate-800">{expense.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-xs">{expense.category}</span>
                          <span>•</span>
                          <span>{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-slate-500 mt-1">{expense.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">₹{expense.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-12">
                <Wallet className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No expenses recorded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
