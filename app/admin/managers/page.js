'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { managerAPI, branchAPI } from '@/lib/api';
import { Plus, UserCog, Building2, Phone, Pencil, Trash2, AlertTriangle } from 'lucide-react';

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    branchId: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobile: '',
    branchId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [managersData, branchesData] = await Promise.all([
        managerAPI.getAll(),
        branchAPI.getAll(),
      ]);
      setManagers(managersData);
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
      await managerAPI.create(formData);
      setIsDialogOpen(false);
      setFormData({ name: '', mobile: '', branchId: '' });
      loadData();
      alert('Manager created successfully! Login credentials sent.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditClick = (manager) => {
    setSelectedManager(manager);
    setEditFormData({
      name: manager.name,
      mobile: manager.mobile,
      branchId: manager.branchId || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await managerAPI.update(selectedManager.userId, editFormData);
      setIsEditDialogOpen(false);
      setSelectedManager(null);
      loadData();
      alert('Manager updated successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteClick = (manager) => {
    setSelectedManager(manager);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await managerAPI.delete(selectedManager.userId);
      setIsDeleteDialogOpen(false);
      setSelectedManager(null);
      loadData();
      alert('Manager deleted successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.branchId === branchId);
    return branch?.name || 'Unassigned';
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Managers</h2>
            <p className="text-slate-600 mt-1">Manage branch managers</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="mr-2 h-4 w-4" /> Add Manager
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Manager</DialogTitle>
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
                    placeholder="10 digit mobile"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Password will be last 4 digits of mobile</p>
                </div>
                <div>
                  <Label>Assign Branch *</Label>
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
                <Button type="submit" className="w-full">Create Manager</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Manager</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Mobile Number *</Label>
                <Input
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  type="tel"
                  maxLength={10}
                  placeholder="10 digit mobile"
                  required
                />
              </div>
              <div>
                <Label>Assign Branch *</Label>
                <Select
                  value={editFormData.branchId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, branchId: value })}
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
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete Manager
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-600">
                Are you sure you want to delete <strong>{selectedManager?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteConfirm}>
                  Delete Manager
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managers.map((manager) => (
              <Card key={manager.userId} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      {manager.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-800">{manager.name}</h3>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4" />
                          {manager.mobile}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="h-4 w-4" />
                          {getBranchName(manager.branchId)}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          manager.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {manager.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClick(manager)}
                            data-testid={`edit-manager-${manager.userId}`}
                          >
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteClick(manager)}
                            data-testid={`delete-manager-${manager.userId}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {managers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <UserCog className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No managers found. Create your first manager!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
