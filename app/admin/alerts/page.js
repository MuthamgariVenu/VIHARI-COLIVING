'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { alertAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MessageSquare, LogOut } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertAPI.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Alerts & Notifications</h2>
          <p className="text-slate-600 mt-1">Items requiring your attention</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Complaints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Pending Complaints ({alerts?.pendingComplaints?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts?.pendingComplaints?.map((complaint) => (
                    <div key={complaint.complaintId} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{complaint.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{complaint.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              complaint.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                              complaint.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {complaint.priority}
                            </span>
                            <span className="text-xs text-slate-500">{complaint.status}</span>
                          </div>
                        </div>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                  ))}
                  {(!alerts?.pendingComplaints || alerts.pendingComplaints.length === 0) && (
                    <p className="text-slate-500 text-center py-8">No pending complaints</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Exit Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Pending Exit Requests ({alerts?.pendingExits?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts?.pendingExits?.map((exit) => (
                    <div key={exit.exitRequestId} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">Exit Request</h4>
                          {exit.reason && (
                            <p className="text-sm text-slate-600 mt-1">{exit.reason}</p>
                          )}
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              exit.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              exit.status === 'MANAGER_APPROVED' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {exit.status}
                            </span>
                          </div>
                        </div>
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  ))}
                  {(!alerts?.pendingExits || alerts.pendingExits.length === 0) && (
                    <p className="text-slate-500 text-center py-8">No pending exit requests</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{alerts?.count || 0}</p>
              <p className="text-blue-100 mt-1">Total items requiring attention</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}