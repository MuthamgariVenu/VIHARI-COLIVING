'use client';

import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentAPI, tenantAPI } from '@/lib/api';
import { Plus, Receipt, Search, X } from 'lucide-react';
import { format } from 'date-fns';

export default function ManagerPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const searchRef = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const filteredTenants = tenants.filter(tenant => {
    const query = searchQuery.toLowerCase();
    return tenant.name.toLowerCase().includes(query) || 
           tenant.mobile.includes(query);
  });

  const handleTenantSelect = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({ ...formData, tenantId: tenant.tenantId });
    setSearchQuery(tenant.name + ' - ' + tenant.mobile);
    setShowSearchResults(false);
  };

  const clearTenantSelection = () => {
    setSelectedTenant(null);
    setFormData({ ...formData, tenantId: '' });
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tenantId) {
      alert('Please select a tenant');
      return;
    }
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
      setSelectedTenant(null);
      setSearchQuery('');
      loadData();
      alert('Payment recorded successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const getTenantName = (tenantId) => tenants.find(t => t.tenantId === tenantId)?.name || 'Unknown';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <DashboardLayout role="MANAGER">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Payments</h2>
            <p className="text-slate-600 mt-1">Track tenant payments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedTenant(null);
              setSearchQuery('');
            }
          }}>
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
                <div ref={searchRef} className="relative">
                  <Label>Tenant *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or mobile..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                        if (selectedTenant && e.target.value !== `${selectedTenant.name} - ${selectedTenant.mobile}`) {
                          setSelectedTenant(null);
                          setFormData({ ...formData, tenantId: '' });
                        }
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      className="pl-10 pr-10"
                    />
                    {selectedTenant && (
                      <button
                        type="button"
                        onClick={clearTenantSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showSearchResults && searchQuery && !selectedTenant && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredTenants.length > 0 ? (
                        filteredTenants.map((tenant) => (
                          <div
                            key={tenant.tenantId}
                            className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                            onClick={() => handleTenantSelect(tenant)}
                          >
                            <p className="font-medium text-slate-800">{tenant.name}</p>
                            <p className="text-sm text-slate-500">{tenant.mobile}</p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-slate-500 text-sm">No tenants found</div>
                      )}
                    </div>
                  )}
                  {selectedTenant && (
                    <p className="text-xs text-green-600 mt-1">Selected: {selectedTenant.name}</p>
                  )}
                </div>
                <div>
                  <Label>Amount *</Label>
                  <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
                <div>
                  <Label>Payment Date *</Label>
                  <Input type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} required />
                </div>
                <div>
                  <Label>Payment Mode *</Label>
                  <Select value={formData.paymentMode} onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })}>
                    <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (<SelectItem key={month} value={month}>{month}</SelectItem>))}
                    </SelectContent>
                  </Select>
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
                        <h4 className="font-semibold text-lg text-slate-800">{getTenantName(payment.tenantId)}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span>{payment.paymentMode}</span>
                          <span>•</span>
                          <span>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
