'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tenantAPI, branchAPI, roomAPI, bedAPI } from '@/lib/api';
import { Plus, Users, Building2, DoorOpen, Bed as BedIcon, Phone, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    branchId: '',
    roomId: '',
    bedId: '',
    joinDate: new Date().toISOString().split('T')[0],
    monthlyRent: '',
    advanceAmount: '',
    refundableDeposit: '',
    nonRefundableDeposit: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantsData, branchesData, roomsData, bedsData] = await Promise.all([
        tenantAPI.getAll(),
        branchAPI.getAll(),
        roomAPI.getAll(),
        bedAPI.getAll(),
      ]);
      setTenants(tenantsData);
      setBranches(branchesData);
      setRooms(roomsData);
      setBeds(bedsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tenantAPI.create({
        ...formData,
        monthlyRent: parseFloat(formData.monthlyRent),
        advanceAmount: parseFloat(formData.advanceAmount) || 0,
        refundableDeposit: parseFloat(formData.refundableDeposit) || 0,
        nonRefundableDeposit: parseFloat(formData.nonRefundableDeposit) || 0,
      });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        mobile: '',
        branchId: '',
        roomId: '',
        bedId: '',
        joinDate: new Date().toISOString().split('T')[0],
        monthlyRent: '',
        advanceAmount: '',
        refundableDeposit: '',
        nonRefundableDeposit: '',
      });
      loadData();
      alert('Tenant created successfully! Login credentials sent.');
    } catch (error) {
      alert(error.message);
    }
  };

  const getBranchName = (branchId) => {
    return branches.find(b => b.branchId === branchId)?.name || '-';
  };

  const getRoomNumber = (roomId) => {
    return rooms.find(r => r.roomId === roomId)?.roomNumber || '-';
  };

  const getBedNumber = (bedId) => {
    return beds.find(b => b.bedId === bedId)?.bedNumber || '-';
  };

  const availableBeds = beds.filter(b => !b.isOccupied && b.branchId === formData.branchId && b.roomId === formData.roomId);

  const handleExportCSV = () => {
    const csvData = tenants.map(tenant => ({
      'Tenant Name': tenant.name,
      'Mobile': tenant.mobile,
      'Branch': getBranchName(tenant.branchId),
      'Room': getRoomNumber(tenant.roomId),
      'Bed': getBedNumber(tenant.bedId),
      'Join Date': format(new Date(tenant.joinDate), 'yyyy-MM-dd'),
      'Monthly Rent': tenant.monthlyRent,
      'Advance Amount': tenant.advanceAmount,
      'Refundable Deposit': tenant.refundableDeposit,
      'Status': tenant.status
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Tenants</h2>
            <p className="text-slate-600 mt-1">Manage hostel tenants</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="mr-2 h-4 w-4" /> Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
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
                  <Label>Mobile Number *</Label>
                  <Input
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    type="tel"
                    maxLength={10}
                    required
                  />
                </div>
                <div>
                  <Label>Branch *</Label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) => setFormData({ ...formData, branchId: value, roomId: '', bedId: '' })}
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
                  <Label>Room *</Label>
                  <Select
                    value={formData.roomId}
                    onValueChange={(value) => setFormData({ ...formData, roomId: value, bedId: '' })}
                    disabled={!formData.branchId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.filter(r => r.branchId === formData.branchId).map((room) => (
                        <SelectItem key={room.roomId} value={room.roomId}>
                          Room {room.roomNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bed *</Label>
                  <Select
                    value={formData.bedId}
                    onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                    disabled={!formData.roomId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bed" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBeds.map((bed) => (
                        <SelectItem key={bed.bedId} value={bed.bedId}>
                          Bed {bed.bedNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">{availableBeds.length} available beds</p>
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
                <div>
                  <Label>Monthly Rent *</Label>
                  <Input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Advance Amount</Label>
                  <Input
                    type="number"
                    value={formData.advanceAmount}
                    onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Refundable Deposit</Label>
                  <Input
                    type="number"
                    value={formData.refundableDeposit}
                    onChange={(e) => setFormData({ ...formData, refundableDeposit: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Non-Refundable Deposit</Label>
                  <Input
                    type="number"
                    value={formData.nonRefundableDeposit}
                    onChange={(e) => setFormData({ ...formData, nonRefundableDeposit: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Create Tenant</Button>
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
            {tenants.map((tenant) => (
              <Card key={tenant.tenantId} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-800">{tenant.name}</h3>
                      <div className="space-y-1 mt-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {tenant.mobile}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {getBranchName(tenant.branchId)}
                        </div>
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4" />
                          Room {getRoomNumber(tenant.roomId)}
                        </div>
                        <div className="flex items-center gap-2">
                          <BedIcon className="h-4 w-4" />
                          Bed {getBedNumber(tenant.bedId)}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">Monthly Rent</p>
                          <p className="font-semibold text-green-600">₹{tenant.monthlyRent}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tenant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Joined: {format(new Date(tenant.joinDate), 'MMM dd, yyyy')}
                      </p>
                      {tenant.idProofPath && (
                        <Button
                          onClick={() => window.open(tenant.idProofPath, '_blank')}
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View ID Proof
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tenants.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No tenants found. Create your first tenant!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}