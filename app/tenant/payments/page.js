'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardAPI } from '@/lib/api';
import { Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantPaymentsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tenantData = await dashboardAPI.getTenantData();
      setData(tenantData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="TENANT">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">My Payments</h2>
          <p className="text-slate-600 mt-1">View your payment history</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-green-100">Monthly Rent</p>
                    <p className="text-2xl font-bold">₹{data?.profile?.monthlyRent || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-100">Total Paid</p>
                    <p className="text-2xl font-bold">₹{data?.profile?.totalPaid || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-100">Balance</p>
                    <p className="text-2xl font-bold">₹{(data?.profile?.monthlyRent || 0) - (data?.profile?.totalPaid || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.payments?.map((payment) => (
                    <div key={payment.paymentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{payment.paymentMode}</p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </p>
                          {payment.month && payment.year && (
                            <p className="text-xs text-slate-500">{payment.month} {payment.year}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">₹{payment.amount}</p>
                      </div>
                    </div>
                  ))}
                  {(!data?.payments || data.payments.length === 0) && (
                    <p className="text-slate-500 text-center py-8">No payment history</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}