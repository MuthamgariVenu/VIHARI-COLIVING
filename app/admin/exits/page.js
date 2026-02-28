'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exitRequestAPI } from '@/lib/api';
import { LogOut } from 'lucide-react';
import { format } from 'date-fns';

export default function ExitsPage() {
  const [exitRequests, setExitRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await exitRequestAPI.getAll();
      setExitRequests(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (exitRequestId, newStatus) => {
    try {
      await exitRequestAPI.update(exitRequestId, { status: newStatus });
      loadData();
      alert('Exit request status updated!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleComplete = async (exitRequestId) => {
    if (!confirm('Complete exit process? This will free the bed and make tenant inactive.')) return;
    try {
      await exitRequestAPI.complete(exitRequestId);
      loadData();
      alert('Exit process completed successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Exit Requests</h2>
          <p className="text-slate-600 mt-1">Manage tenant exit requests</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {exitRequests.map((exit) => (
              <Card key={exit.exitRequestId}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                        <LogOut className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-slate-800">Exit Request</h4>
                        {exit.reason && (
                          <p className="text-sm text-slate-600 mt-1">{exit.reason}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <span>Expected: {format(new Date(exit.expectedExitDate), 'MMM dd, yyyy')}</span>
                          <span>•</span>
                          <span>Requested: {format(new Date(exit.requestDate), 'MMM dd, yyyy')}</span>
                        </div>
                        {exit.refundAmount > 0 && (
                          <p className="text-sm text-green-600 mt-2">Refund: ₹{exit.refundAmount}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Select
                        value={exit.status}
                        onValueChange={(value) => handleStatusUpdate(exit.exitRequestId, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="MANAGER_APPROVED">Manager Approved</SelectItem>
                          <SelectItem value="ADMIN_APPROVED">Admin Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {exit.status === 'ADMIN_APPROVED' && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(exit.exitRequestId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Complete Exit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {exitRequests.length === 0 && (
              <div className="text-center py-12">
                <LogOut className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No exit requests found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}