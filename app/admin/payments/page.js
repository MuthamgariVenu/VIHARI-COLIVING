'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentAPI, tenantAPI } from '@/lib/api';
import { Plus, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    month: '',
    year: new Date().getFullYear().toString(),
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, tenantsData] = await Promise.all([
        paymentAPI.getAll(),
        tenantAPI.getAll(),
      ]);
      setPayments(paymentsData);
      setTenants(tenantsData.filter(t => t.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await paymentAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
        year: parseInt(formData.year),
      });
      setIsDialogOpen(false);
      setFormData({
        tenantId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'CASH',
        month: '',
        year: new Date().getFullYear().toString(),
        remarks: '',
      });
      loadData();
      alert('Payment recorded successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const getTenantName = (tenantId) => {
    return tenants.find(t => t.tenantId === tenantId)?.name || 'Unknown';
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Payments</h2>
            <p className="text-slate-600 mt-1">Track tenant payments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="mr-2 h-4 w-4" /> Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Tenant *</Label>
                  <Select
                    value={formData.tenantId}
                    onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                          {tenant.name} - {tenant.mobile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label>Payment Date *</Label>
                  <Input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Payment Mode *</Label>
                  <Select
                    value={formData.paymentMode}
                    onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Month</Label>
                  <Select
                    value={formData.month}
                    onValueChange={(value) => setFormData({ ...formData, month: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Input
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Record Payment</Button>
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
            {payments.map((payment) => (
              <Card key={payment.paymentId}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg text-slate-800">
                          {getTenantName(payment.tenantId)}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span>{payment.paymentMode}</span>
                          <span>•</span>
                          <span>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</span>
                          {payment.month && payment.year && (
                            <>
                              <span>•</span>
                              <span>{payment.month} {payment.year}</span>
                            </>
                          )}
                        </div>
                        {payment.remarks && (
                          <p className="text-sm text-slate-500 mt-1">{payment.remarks}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No payments recorded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}