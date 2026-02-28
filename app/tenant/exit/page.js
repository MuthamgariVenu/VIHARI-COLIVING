'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { exitRequestAPI, dashboardAPI } from '@/lib/api';
import { Plus, LogOut } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantExitPage() {
  const [exitRequests, setExitRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    expectedExitDate: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantData, exitData] = await Promise.all([
        dashboardAPI.getTenantData(),
        exitRequestAPI.getAll(),
      ]);
      setProfile(tenantData.profile);
      setExitRequests(exitData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await exitRequestAPI.create(formData);
      setIsDialogOpen(false);
      setFormData({ expectedExitDate: '', reason: '' });
      loadData();
      alert('Exit request submitted successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <DashboardLayout role="TENANT">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Exit Request</h2>
            <p className="text-slate-600 mt-1">Request to exit from hostel</p>
          </div>
          {profile?.status === 'ACTIVE' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Plus className="mr-2 h-4 w-4" /> Request Exit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Exit Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Expected Exit Date *</Label>
                    <Input
                      type="date"
                      value={formData.expectedExitDate}
                      onChange={(e) => setFormData({ ...formData, expectedExitDate: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={4}
                      placeholder="Please provide a reason for exit"
                    />
                  </div>
                  <Button type="submit" className="w-full">Submit Request</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {exitRequests.map((exit) => (
              <Card key={exit.exitRequestId}>
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-6 w-6" />
                    <CardTitle>Exit Request</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Expected Exit Date</p>
                      <p className="font-medium text-slate-800">
                        {format(new Date(exit.expectedExitDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    {exit.reason && (
                      <div>
                        <p className="text-sm text-slate-600">Reason</p>
                        <p className="font-medium text-slate-800">{exit.reason}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        exit.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        exit.status === 'MANAGER_APPROVED' ? 'bg-blue-100 text-blue-700' :
                        exit.status === 'ADMIN_APPROVED' ? 'bg-green-100 text-green-700' :
                        exit.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {exit.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Requested On</p>
                      <p className="font-medium text-slate-800">
                        {format(new Date(exit.requestDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {exitRequests.length === 0 && (
              <div className="text-center py-12">
                <LogOut className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No exit requests</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}