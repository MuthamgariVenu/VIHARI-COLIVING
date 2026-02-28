'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { dashboardAPI, bedAPI, roomAPI } from '@/lib/api';
import { Users, Bed, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format } from 'date-fns';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableBedsModal, setAvailableBedsModal] = useState(false);
  const [availableBedsList, setAvailableBedsList] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const branchId = user.branchId;
      
      const [data, bedsData, roomsData] = await Promise.all([
        dashboardAPI.getManagerStats(),
        bedAPI.getAll(),
        roomAPI.getAll(),
      ]);
      
      // Filter beds for this branch that are not occupied and have ACTIVE status
      const branchBeds = bedsData.filter(b => b.branchId === branchId);
      const availableBeds = branchBeds.filter(b => !b.isOccupied && b.status === 'ACTIVE');
      const occupiedBeds = branchBeds.filter(b => b.isOccupied && b.status === 'ACTIVE');
      const totalActiveBeds = branchBeds.filter(b => b.status === 'ACTIVE');
      
      // Override stats with correct calculations
      const correctedStats = {
        ...data,
        stats: {
          ...data.stats,
          totalBeds: totalActiveBeds.length,
          occupiedBeds: occupiedBeds.length,
          availableBeds: availableBeds.length,
        }
      };
      
      setStats(correctedStats);
      setAvailableBedsList(availableBeds);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomNumber = (roomId) => rooms.find(r => r.roomId === roomId)?.roomNumber || '-';

  const handleAvailableBedsClick = () => {
    setAvailableBedsModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout role="MANAGER">
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
    <DashboardLayout role="MANAGER">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Branch Dashboard</h2>
          <p className="text-slate-600 mt-1">Overview of your branch performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tenants"
            value={stats?.stats?.totalTenants || 0}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Total Beds"
            value={stats?.stats?.totalBeds || 0}
            icon={Bed}
            color="teal"
          />
          <StatCard
            title="Occupied Beds"
            value={stats?.stats?.occupiedBeds || 0}
            icon={Bed}
            color="green"
          />
          <div onClick={handleAvailableBedsClick} className="cursor-pointer">
            <StatCard
              title="Available Beds"
              value={stats?.stats?.availableBeds || 0}
              icon={Bed}
              color="orange"
            />
          </div>
          <StatCard
            title="Revenue"
            value={`₹${stats?.stats?.revenue?.toLocaleString() || 0}`}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Expenses"
            value={`₹${stats?.stats?.expenses?.toLocaleString() || 0}`}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            title="Balance"
            value={`₹${stats?.stats?.balance?.toLocaleString() || 0}`}
            icon={Wallet}
            color={stats?.stats?.balance >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Available Beds Modal */}
        <Dialog open={availableBedsModal} onOpenChange={setAvailableBedsModal}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Available Beds ({availableBedsList.length})</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {availableBedsList.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Room</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Bed</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableBedsList.map((bed) => (
                      <tr key={bed.bedId} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-3 text-sm">Room {getRoomNumber(bed.roomId)}</td>
                        <td className="py-2 px-3 text-sm">Bed {bed.bedNumber}</td>
                        <td className="py-2 px-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            Available
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-slate-500 py-4">No available beds</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Recent Activities - Fixed Height with Scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col" style={{ height: '320px' }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle>Recent Tenants</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-3">
                  {stats?.recentActivities?.tenants?.slice(0, 10).map((tenant) => (
                    <div key={tenant.tenantId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">{tenant.name}</p>
                        <p className="text-sm text-slate-500">{tenant.mobile}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">₹{tenant.monthlyRent}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(tenant.joinDate), 'MMM dd')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentActivities?.tenants || stats.recentActivities.tenants.length === 0) && (
                    <p className="text-slate-500 text-center py-4">No recent tenants</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="flex flex-col" style={{ height: '320px' }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-3">
                  {stats?.recentActivities?.payments?.slice(0, 10).map((payment) => (
                    <div key={payment.paymentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">{payment.paymentMode}</p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-green-600">₹{payment.amount}</p>
                    </div>
                  ))}
                  {(!stats?.recentActivities?.payments || stats.recentActivities.payments.length === 0) && (
                    <p className="text-slate-500 text-center py-4">No recent payments</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="flex flex-col" style={{ height: '320px' }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle>Recent Complaints</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-3">
                  {stats?.recentActivities?.complaints?.slice(0, 10).map((complaint) => (
                    <div key={complaint.complaintId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{complaint.title}</p>
                        <p className="text-sm text-slate-500">{complaint.priority}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        complaint.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                  ))}
                  {(!stats?.recentActivities?.complaints || stats.recentActivities.complaints.length === 0) && (
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
