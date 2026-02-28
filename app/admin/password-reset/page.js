'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { managerAPI, tenantAPI } from '@/lib/api';
import { Search, KeyRound, User, UserCog, RefreshCw, CheckCircle } from 'lucide-react';

export default function AdminPasswordResetPage() {
  const [managers, setManagers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managerSearch, setManagerSearch] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, type: '' });
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [managersData, tenantsData] = await Promise.all([
        managerAPI.getAll(),
        tenantAPI.getAll(),
      ]);
      setManagers(managersData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredManagers = useMemo(() => {
    if (!managerSearch.trim()) return managers;
    const query = managerSearch.toLowerCase();
    return managers.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.mobile.includes(query)
    );
  }, [managers, managerSearch]);

  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return tenants;
    const query = tenantSearch.toLowerCase();
    return tenants.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.mobile.includes(query)
    );
  }, [tenants, tenantSearch]);

  const handleResetClick = (user, type) => {
    setConfirmDialog({ open: true, user, type });
  };

  const handleConfirmReset = async () => {
    if (!confirmDialog.user) return;
    
    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: confirmDialog.user.userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      alert(`Password reset successful!\nNew password: Last 4 digits of mobile (${data.mobile.slice(-4)})`);
      setConfirmDialog({ open: false, user: null, type: '' });
    } catch (error) {
      alert(error.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Password Reset</h2>
          <p className="text-slate-600 mt-1">Reset passwords for managers and tenants</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="managers">
              <TabsList className="mb-6">
                <TabsTrigger value="managers" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Managers
                </TabsTrigger>
                <TabsTrigger value="tenants" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tenants
                </TabsTrigger>
              </TabsList>

              <TabsContent value="managers" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or mobile..."
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredManagers.map((manager) => (
                    <div key={manager.managerId || manager.userId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                          {manager.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{manager.name}</p>
                          <p className="text-sm text-slate-500">{manager.mobile}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleResetClick(manager, 'Manager')}
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </div>
                  ))}
                  {filteredManagers.length === 0 && (
                    <p className="text-center text-slate-500 py-8">
                      {managerSearch ? 'No managers match your search' : 'No managers found'}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tenants" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or mobile..."
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredTenants.map((tenant) => (
                    <div key={tenant.tenantId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{tenant.name}</p>
                          <p className="text-sm text-slate-500">{tenant.mobile}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {tenant.status}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleResetClick(tenant, 'Tenant')}
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </div>
                  ))}
                  {filteredTenants.length === 0 && (
                    <p className="text-center text-slate-500 py-8">
                      {tenantSearch ? 'No tenants match your search' : 'No tenants found'}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Confirm Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-orange-500" />
                Reset Password
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to reset the password for <strong>{confirmDialog.user?.name}</strong>?
                <br /><br />
                The new password will be set to the <strong>last 4 digits of their mobile number</strong>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, user: null, type: '' })}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReset}
                disabled={resetting}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {resetting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
