'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { branchAPI, tenantAPI, bedAPI, paymentAPI, expenseAPI, complaintAPI } from '@/lib/api';
import { Users, DoorOpen, Bed, TrendingUp, TrendingDown, Wallet, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [branches, setBranches] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [beds, setBeds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [tenantSearch, setTenantSearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [branchesData, tenantsData, bedsData, paymentsData, expensesData, complaintsData] = await Promise.all([
        branchAPI.getAll(),
        tenantAPI.getAll(),
        bedAPI.getAll(),
        paymentAPI.getAll(),
        expenseAPI.getAll(),
        complaintAPI.getAll(),
      ]);
      setBranches(branchesData.filter(b => b.status === 'ACTIVE'));
      setTenants(tenantsData);
      setBeds(bedsData.filter(b => b.status === 'ACTIVE'));
      setPayments(paymentsData);
      setExpenses(expensesData);
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected branch
  const filteredData = useMemo(() => {
    const activeTenants = tenants.filter(t => t.status === 'ACTIVE');
    
    if (selectedBranch === 'all') {
      return {
        tenants: activeTenants,
        beds: beds,
        payments: payments,
        expenses: expenses,
        complaints: complaints,
      };
    }

    const branchTenants = activeTenants.filter(t => t.branchId === selectedBranch);
    const branchBeds = beds.filter(b => b.branchId === selectedBranch);
    const branchTenantIds = branchTenants.map(t => t.tenantId);
    const branchPayments = payments.filter(p => branchTenantIds.includes(p.tenantId));
    const branchExpenses = expenses.filter(e => e.branchId === selectedBranch);
    const branchComplaints = complaints.filter(c => branchTenantIds.includes(c.tenantId));

    return {
      tenants: branchTenants,
      beds: branchBeds,
      payments: branchPayments,
      expenses: branchExpenses,
      complaints: branchComplaints,
    };
  }, [selectedBranch, tenants, beds, payments, expenses, complaints]);

  // Calculate stats from filtered data
  const stats = useMemo(() => {
    const totalTenants = filteredData.tenants.length;
    const totalBeds = filteredData.beds.length;
    const occupiedBeds = filteredData.beds.filter(b => b.isOccupied).length;
    const availableBeds = totalBeds - occupiedBeds;
    const revenue = filteredData.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netBalance = revenue - totalExpenses;
    
    // Refund Amount = Sum of refundable deposits of all ACTIVE tenants
    const refundAmount = filteredData.tenants.reduce((sum, t) => sum + (t.refundableDeposit || 0), 0);

    return {
      totalTenants,
      totalBeds,
      occupiedBeds,
      availableBeds,
      revenue,
      expenses: totalExpenses,
      netBalance,
      refundAmount,
    };
  }, [filteredData]);

  // Recent activities sorted by date
  const recentActivities = useMemo(() => {
    const sortByDate = (a, b) => new Date(b.createdAt || b.joinDate || b.paymentDate) - new Date(a.createdAt || a.joinDate || a.paymentDate);
    
    return {
      tenants: [...filteredData.tenants].sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate)),
      payments: [...filteredData.payments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
      complaints: [...filteredData.complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    };
  }, [filteredData]);

  // Filter tenants by search
  const searchedTenants = useMemo(() => {
    if (!tenantSearch.trim()) return recentActivities.tenants;
    const query = tenantSearch.toLowerCase();
    return recentActivities.tenants.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.mobile.includes(query)
    );
  }, [recentActivities.tenants, tenantSearch]);

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Filter by Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.branchId} value={branch.branchId}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <p className="text-sm text-slate-500">
                  {selectedBranch === 'all' 
                    ? `Showing data for all ${branches.length} branches` 
                    : `Showing data for: ${branches.find(b => b.branchId === selectedBranch)?.name}`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tenants"
            value={stats.totalTenants}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Total Beds"
            value={stats.totalBeds}
            icon={Bed}
            color="teal"
          />
          <StatCard
            title="Occupied Beds"
            value={stats.occupiedBeds}
            icon={DoorOpen}
            color="green"
          />
          <StatCard
            title="Available Beds"
            value={stats.availableBeds}
            icon={DoorOpen}
            color="orange"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Total Expenses"
            value={`₹${stats.expenses.toLocaleString()}`}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            title="Net Balance"
            value={`₹${stats.netBalance.toLocaleString()}`}
            icon={Wallet}
            color={stats.netBalance >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Refund Amount"
            value={`₹${stats.refundAmount.toLocaleString()}`}
            icon={RefreshCw}
            color="blue"
          />
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tenants */}
          <Card className="flex flex-col" style={{ height: '400px' }}>
            <CardHeader className="flex-shrink-0 pb-2">
              <CardTitle>Recent Tenants</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-3">
                  {searchedTenants.slice(0, 20).map((tenant) => (
                    <div key={tenant.tenantId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">{tenant.name}</p>
                        <p className="text-sm text-slate-500">{tenant.mobile}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">₹{tenant.monthlyRent}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(tenant.joinDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {searchedTenants.length === 0 && (
                    <p className="text-slate-500 text-center py-4">
                      {tenantSearch ? 'No tenants match your search' : 'No recent tenants'}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="flex flex-col" style={{ height: '400px' }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-3">
                  {recentActivities.payments.slice(0, 20).map((payment) => (
                    <div key={payment.paymentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">{payment.paymentMode}</p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">₹{payment.amount}</p>
                        <p className="text-xs text-slate-500">{payment.month} {payment.year}</p>
                      </div>
                    </div>
                  ))}
                  {recentActivities.payments.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No recent payments</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Complaints */}
          <Card className="flex flex-col" style={{ height: '400px' }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle>Recent Complaints</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-3">
                  {recentActivities.complaints.slice(0, 20).map((complaint) => (
                    <div key={complaint.complaintId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{complaint.title}</p>
                        <p className="text-sm text-slate-500">{complaint.category || complaint.priority}</p>
                      </div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          complaint.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {complaint.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentActivities.complaints.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No recent complaints</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
