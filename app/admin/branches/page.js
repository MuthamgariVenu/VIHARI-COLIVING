'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { branchAPI } from '@/lib/api';
import { Plus, Building2, MapPin, Phone, Edit, Trash2 } from 'lucide-react';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    facilities: '',
    foodDetails: '',
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await branchAPI.getAll();
      setBranches(data);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setIsEditMode(true);
    setEditingBranchId(branch.branchId);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      facilities: branch.facilities ? branch.facilities.join(', ') : '',
      foodDetails: branch.foodDetails || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (branchId) => {
    if (!confirm('Delete this branch? This will remove it from the landing page.')) return;
    try {
      await branchAPI.update(branchId, { status: 'INACTIVE' });
      loadBranches();
      alert('Branch deleted!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const facilities = formData.facilities ? formData.facilities.split(',').map(f => f.trim()) : [];
      if (isEditMode) {
        await branchAPI.update(editingBranchId, { ...formData, facilities });
        alert('Branch updated!');
      } else {
        await branchAPI.create({ ...formData, facilities });
        alert('Branch created!');
      }
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingBranchId(null);
      setFormData({ name: '', code: '', address: '', city: '', phone: '', facilities: '', foodDetails: '' });
      loadBranches();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Branches</h2>
            <p className="text-slate-600 mt-1">Manage your hostel branches</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="mr-2 h-4 w-4" /> Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Branch Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Branch Code *</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} type="tel" required />
                </div>
                <div>
                  <Label>Facilities</Label>
                  <Input value={formData.facilities} onChange={(e) => setFormData({ ...formData, facilities: e.target.value })} placeholder="WiFi, AC, Gym" />
                </div>
                <div>
                  <Label>Food Details</Label>
                  <Input value={formData.foodDetails} onChange={(e) => setFormData({ ...formData, foodDetails: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">{isEditMode ? 'Update Branch' : 'Create Branch'}</Button>
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
            {branches.map((branch) => (
              <Card key={branch.branchId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8" />
                    <div>
                      <CardTitle>{branch.name}</CardTitle>
                      <p className="text-sm text-blue-100">Code: {branch.code}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">{branch.address}</p>
                      <p className="text-sm text-slate-500">{branch.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <p className="text-sm text-slate-600">{branch.phone}</p>
                  </div>
                  {branch.facilities && branch.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {branch.facilities.map((facility, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{facility}</span>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${branch.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {branch.status}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(branch)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(branch.branchId)} className="text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {branches.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No branches found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
