'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Download, RefreshCw, Clock, Calendar, Hash } from 'lucide-react';

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/backup/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Backup created successfully!\nBackup ID: ${data.backupId}\nDate: ${data.backupDate}\nTime: ${data.backupTime}`);
        loadBackups();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create backup');
      }
    } catch (error) {
      alert('Error creating backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/backup/download/${fileName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Error downloading backup');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Database Backup</h2>
            <p className="text-slate-600 mt-1">Create and manage database backups</p>
          </div>
          <Button
            onClick={handleCreateBackup}
            disabled={creating}
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            {creating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Create Backup
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Backup History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No backups found. Create your first backup!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Backup ID
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Size</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.backupId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                            {backup.backupId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{backup.backupDate}</td>
                        <td className="py-3 px-4 text-slate-700">{backup.backupTime}</td>
                        <td className="py-3 px-4 text-slate-600">{formatFileSize(backup.size)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            backup.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {backup.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(backup.fileName)}
                            className="gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
