'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardAPI } from '@/lib/api';
import { User, Receipt, Home, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tenantData = await dashboardAPI.getTenantData();
      setData(tenantData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="TENANT">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const profile = data?.profile;
  const totalDue = (profile?.monthlyRent || 0) - (profile?.totalPaid || 0);

  return (
    <DashboardLayout role="TENANT">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">My Dashboard</h2>
          <p className="text-slate-600 mt-1">Welcome to your personal dashboard</p>
        </div>

        {/* Profile Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {profile?.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{profile?.name}</h3>
                <p className="text-blue-100 mt-1">{profile?.mobile}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-blue-100">Monthly Rent</p>
                    <p className="text-lg font-bold">₹{profile?.monthlyRent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Total Paid</p>
                    <p className="text-lg font-bold">₹{profile?.totalPaid || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Refundable Deposit</p>
                    <p className="text-lg font-bold">₹{profile?.refundableDeposit || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Join Date</p>
                    <p className="text-lg font-bold">
                      {profile?.joinDate ? format(new Date(profile.joinDate), 'MMM yyyy') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Payment Status</p>
                  <p className="text-xl font-bold text-slate-800">
                    {totalDue <= 0 ? 'Paid' : 'Due'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-xl font-bold text-slate-800">{profile?.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Duration</p>
                  <p className="text-xl font-bold text-slate-800">
                    {profile?.joinDate ? Math.floor((new Date() - new Date(profile.joinDate)) / (1000 * 60 * 60 * 24 * 30)) + 1 : 0} months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.payments?.slice(0, 10).map((payment) => (
                <div key={payment.paymentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{payment.paymentMode}</p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                    </p>
                    {payment.remarks && (
                      <p className="text-xs text-slate-500 mt-1">{payment.remarks}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">₹{payment.amount}</p>
                    {payment.month && payment.year && (
                      <p className="text-xs text-slate-500">{payment.month} {payment.year}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!data?.payments || data.payments.length === 0) && (
                <p className="text-slate-500 text-center py-4">No payment history</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>My Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.complaints?.slice(0, 5).map((complaint) => (
                <div key={complaint.complaintId} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{complaint.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{complaint.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
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
              {(!data?.complaints || data.complaints.length === 0) && (
                <p className="text-slate-500 text-center py-4">No complaints</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}