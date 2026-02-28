'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { complaintAPI } from '@/lib/api';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
  });

  const categories = ['Electricity', 'Water', 'Cleaning', 'Other'];

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const data = await complaintAPI.getAll();
      setComplaints(data);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    try {
      await complaintAPI.create(formData);
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'MEDIUM',
      });
      loadComplaints();
      alert('Complaint submitted successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryStyle = (category) => {
    switch (category) {
      case 'Electricity':
        return 'bg-amber-100 text-amber-700';
      case 'Water':
        return 'bg-cyan-100 text-cyan-700';
      case 'Cleaning':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <DashboardLayout role="TENANT">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">My Complaints</h2>
            <p className="text-slate-600 mt-1">Raise and track your complaints</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Plus className="mr-2 h-4 w-4" /> Create Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Complaint</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title of the issue"
                    required
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  Submit Complaint
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : complaints.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Complaints Yet</h3>
              <p className="text-slate-500 mb-4">You haven't raised any complaints. Click the button above to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.complaintId} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(complaint.status)}
                        <h3 className="text-lg font-semibold text-slate-800">{complaint.title}</h3>
                      </div>
                      <p className="text-slate-600 mb-3">{complaint.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${getCategoryStyle(complaint.category)}`}>
                          {complaint.category}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full border ${getStatusStyle(complaint.status)}`}>
                          {complaint.status === 'IN_PROGRESS' ? 'In Progress' : complaint.status.charAt(0) + complaint.status.slice(1).toLowerCase()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
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
