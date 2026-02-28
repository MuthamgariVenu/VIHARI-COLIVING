'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { complaintAPI } from '@/lib/api';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await complaintAPI.getAll();
      setComplaints(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await complaintAPI.update(complaintId, { status: newStatus });
      loadData();
      alert('Complaint status updated!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <DashboardLayout role="MANAGER">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Complaints</h2>
          <p className="text-slate-600 mt-1">View and manage complaints</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.complaintId}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-slate-800">{complaint.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{complaint.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            complaint.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                            complaint.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {complaint.priority}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Select
                        value={complaint.status}
                        onValueChange={(value) => handleStatusUpdate(complaint.complaintId, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {complaints.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No complaints found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}