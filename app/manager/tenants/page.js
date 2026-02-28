'use client';

import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tenantAPI, roomAPI, bedAPI } from '@/lib/api';
import { Plus, Users, Upload, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ManagerTenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofUploaded, setIdProofUploaded] = useState(null);
  const fileInputRef = useRef(null);
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const branchId = user.branchId;
      
      const [tenantsData, roomsData, bedsData] = await Promise.all([
        tenantAPI.getAll(),
        roomAPI.getAll(),
        bedAPI.getAll(),
      ]);
      
      setTenants(tenantsData);
      setRooms(roomsData);
      setBeds(bedsData);
      setFormData(prev => ({ ...prev, branchId }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, PDF');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIdProofFile(file);
  };

  const uploadIdProof = async () => {
    if (!idProofFile || !formData.mobile) {
      return null;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', idProofFile);
      uploadFormData.append('mobile', formData.mobile);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/idproof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setIdProofUploaded(data);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload ID proof: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ID proof is selected
    if (!idProofFile) {
      alert('ID Proof is required');
      return;
    }

    // Validate bed is available
    const selectedBed = beds.find(b => b.bedId === formData.bedId);
    if (!selectedBed) {
      alert('Please select a valid bed.');
      return;
    }
    if (selectedBed.isOccupied) {
      alert('This bed is already occupied. Please select an available bed.');
      return;
    }
    
    // Upload ID proof first
    const uploadResult = await uploadIdProof();
    if (!uploadResult) {
      return;
    }

    try {
      const result = await tenantAPI.create({
        ...formData,
        monthlyRent: parseFloat(formData.monthlyRent),
        advanceAmount: parseFloat(formData.advanceAmount) || 0,
        refundableDeposit: parseFloat(formData.refundableDeposit) || 0,
        nonRefundableDeposit: parseFloat(formData.nonRefundableDeposit) || 0,
        idProofFileName: uploadResult.fileName,
        idProofPath: uploadResult.filePath,
      });
      
      if (result.success) {
        setIsDialogOpen(false);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setFormData({
          name: '',
          mobile: '',
          branchId: user.branchId,
          roomId: '',
          bedId: '',
          joinDate: new Date().toISOString().split('T')[0],
          monthlyRent: '',
          advanceAmount: '',
          refundableDeposit: '',
          nonRefundableDeposit: '',
        });
        setIdProofFile(null);
        setIdProofUploaded(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        loadData();
        alert('Tenant created successfully!');
      }
    } catch (error) {
      if (error.message.includes('Mobile already exists') || error.message.includes('duplicate')) {
        alert('Mobile number already exists. Please use a different mobile number.');
      } else if (error.message.includes('bed') || error.message.includes('occupied')) {
        alert('This bed is already occupied. Please select an available bed.');
      } else {
        alert(error.message);
      }
    }
  };

  const handleExportCSV = () => {
    if (tenants.length === 0) return;

    const totalTenants = tenants.length;
    const totalRent = tenants.reduce((sum, t) => sum + (t.monthlyRent || 0), 0);

    const headers = ['Name', 'Mobile', 'Room', 'Bed', 'Monthly Rent'];
    const dataRows = tenants.map(tenant => [
      `"${tenant.name}"`,
      `"${tenant.mobile}"`,
      `"Room ${getRoomNumber(tenant.roomId)}"`,
      `"Bed ${getBedNumber(tenant.bedId)}"`,
      tenant.monthlyRent
    ]);

    const summaryRows = [
      [],
      ['', '', '', 'Total Tenants:', totalTenants],
      ['', '', '', 'Total Rent:', `₹${totalRent.toLocaleString()}`]
    ];

    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.join(',')),
      ...summaryRows.map(row => row.join(','))
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

  const getRoomNumber = (roomId) => rooms.find(r => r.roomId === roomId)?.roomNumber || '-';
  const getBedNumber = (bedId) => beds.find(b => b.bedId === bedId)?.bedNumber || '-';
  
  const availableBeds = beds.filter(b => 
    !b.isOccupied && 
    b.status === 'ACTIVE' && 
    b.branchId === formData.branchId && 
    b.roomId === formData.roomId
  );

  return (
    <DashboardLayout role="MANAGER">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Tenants</h2>
            <p className="text-slate-600 mt-1">Manage hostel tenants</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setIdProofFile(null);
                setIdProofUploaded(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                  <Plus className="mr-2 h-4 w-4" /> Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Tenant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Mobile *</Label>
                    <Input value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} type="tel" maxLength={10} required />
                  </div>
                  <div>
                    <Label>Room *</Label>
                    <Select value={formData.roomId} onValueChange={(value) => setFormData({ ...formData, roomId: value, bedId: '' })}>
                      <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                      <SelectContent>
                        {rooms.filter(r => r.branchId === formData.branchId).map((room) => (
                          <SelectItem key={room.roomId} value={room.roomId}>Room {room.roomNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bed * {availableBeds.length === 0 && formData.roomId && <span className="text-red-500 text-xs ml-2">(No available beds)</span>}</Label>
                    <Select value={formData.bedId} onValueChange={(value) => setFormData({ ...formData, bedId: value })} disabled={!formData.roomId || availableBeds.length === 0}>
                      <SelectTrigger><SelectValue placeholder={availableBeds.length === 0 ? "No available beds" : "Select bed"} /></SelectTrigger>
                      <SelectContent>
                        {availableBeds.map((bed) => (
                          <SelectItem key={bed.bedId} value={bed.bedId}>Bed {bed.bedNumber} (Available)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Join Date *</Label>
                    <Input type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Monthly Rent *</Label>
                    <Input type="number" value={formData.monthlyRent} onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Advance Amount</Label>
                      <Input type="number" value={formData.advanceAmount} onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })} />
                    </div>
                    <div>
                      <Label>Refundable Deposit</Label>
                      <Input type="number" value={formData.refundableDeposit} onChange={(e) => setFormData({ ...formData, refundableDeposit: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Non-Refundable Deposit</Label>
                    <Input type="number" value={formData.nonRefundableDeposit} onChange={(e) => setFormData({ ...formData, nonRefundableDeposit: e.target.value })} />
                  </div>
                  <div>
                    <Label>ID Proof Upload * <span className="text-xs text-slate-500">(JPG, PNG, PDF - Max 5MB)</span></Label>
                    <div className="mt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="idproof-upload"
                      />
                      <label
                        htmlFor="idproof-upload"
                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        {idProofFile ? (
                          <>
                            <FileText className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-600">{idProofFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-slate-400" />
                            <span className="text-sm text-slate-500">Click to upload ID Proof</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Create Tenant'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : tenants.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Tenants Yet</h3>
              <p className="text-slate-500">Add your first tenant to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <Card key={tenant.tenantId} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-800">{tenant.name}</h3>
                      <p className="text-sm text-slate-500">{tenant.mobile}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="text-slate-500">Room:</span> {getRoomNumber(tenant.roomId)}</p>
                        <p><span className="text-slate-500">Bed:</span> {getBedNumber(tenant.bedId)}</p>
                        <p><span className="text-slate-500">Rent:</span> <span className="text-green-600 font-medium">₹{tenant.monthlyRent}</span></p>
                        <p><span className="text-slate-500">Joined:</span> {format(new Date(tenant.joinDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                        tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tenant.status}
                      </span>
                    </div>
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
