'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { branchAPI, tenantAPI, bedAPI, paymentAPI, expenseAPI } from '@/lib/api';
import { 
  Users, Bed, TrendingUp, TrendingDown, Wallet, Search, 
  FileBarChart, Calendar, Building2, RefreshCw, Download,
  ArrowUpRight, ArrowDownRight, DollarSign, FileText, FileSpreadsheet
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function AdminReportsPage() {
  const [branches, setBranches] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [beds, setBeds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [branchesData, tenantsData, bedsData, paymentsData, expensesData] = await Promise.all([
        branchAPI.getAll(),
        tenantAPI.getAll(),
        bedAPI.getAll(),
        paymentAPI.getAll(),
        expenseAPI.getAll(),
      ]);
      setBranches(branchesData.filter(b => b.status === 'ACTIVE'));
      setTenants(tenantsData);
      setBeds(bedsData.filter(b => b.status === 'ACTIVE'));
      setPayments(paymentsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate Report
  const handleGenerateReport = () => {
    setGenerating(true);
    // Simulate a brief loading for UX
    setTimeout(() => {
      setGenerating(false);
      setReportGenerated(true);
    }, 500);
  };

  // Check if date is within range
  const isDateInRange = (dateStr) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return true;
    
    try {
      const date = new Date(dateStr);
      const start = startDate ? startOfDay(new Date(startDate)) : new Date('1900-01-01');
      const end = endDate ? endOfDay(new Date(endDate)) : new Date('2100-12-31');
      return isWithinInterval(date, { start, end });
    } catch {
      return true;
    }
  };

  // Filter data based on selected branch and date range
  const filteredData = useMemo(() => {
    // Filter tenants by branch
    let filteredTenants = tenants.filter(t => t.status === 'ACTIVE');
    let filteredBeds = beds;
    let filteredPayments = payments;
    let filteredExpenses = expenses;

    // Branch filter
    if (selectedBranch !== 'all') {
      filteredTenants = filteredTenants.filter(t => t.branchId === selectedBranch);
      filteredBeds = filteredBeds.filter(b => b.branchId === selectedBranch);
      filteredPayments = filteredPayments.filter(p => p.branchId === selectedBranch);
      filteredExpenses = filteredExpenses.filter(e => e.branchId === selectedBranch);
    }

    // Date filter for payments and expenses
    filteredPayments = filteredPayments.filter(p => isDateInRange(p.paymentDate));
    filteredExpenses = filteredExpenses.filter(e => isDateInRange(e.expenseDate));

    return {
      tenants: filteredTenants,
      beds: filteredBeds,
      payments: filteredPayments,
      expenses: filteredExpenses,
    };
  }, [selectedBranch, startDate, endDate, tenants, beds, payments, expenses]);

  // Calculate stats from filtered data
  const stats = useMemo(() => {
    const totalTenants = filteredData.tenants.length;
    const totalBeds = filteredData.beds.length;
    const occupiedBeds = filteredData.beds.filter(b => b.isOccupied).length;
    const availableBeds = totalBeds - occupiedBeds;
    const revenue = filteredData.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netBalance = revenue - totalExpenses;
    const refundAmount = filteredData.tenants.reduce((sum, t) => sum + (t.refundableDeposit || 0), 0);

    return {
      totalTenants,
      totalBeds,
      occupiedBeds,
      availableBeds,
      revenue,
      expenses: totalExpenses,
      netBalance,
      refundAmount,
    };
  }, [filteredData]);

  // Export to PDF
  const exportToPDF = () => {
    const reportContent = `
HOSTEL ERP - FINANCIAL REPORT
=============================
Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}
Branch: ${selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.branchId === selectedBranch)?.name || 'Unknown'}
Period: ${startDate ? format(new Date(startDate), 'MMM dd, yyyy') : 'Start'} - ${endDate ? format(new Date(endDate), 'MMM dd, yyyy') : 'End'}

SUMMARY
-------
Total Tenants: ${stats.totalTenants}
Occupied Beds: ${stats.occupiedBeds}
Available Beds: ${stats.availableBeds}
Total Revenue: Rs. ${stats.revenue.toLocaleString()}
Total Expenses: Rs. ${stats.expenses.toLocaleString()}
Net Balance: Rs. ${stats.netBalance.toLocaleString()}
Total Refund Amount: Rs. ${stats.refundAmount.toLocaleString()}

TRANSACTION DETAILS
-------------------
${filteredTransactions.map(t => 
`${format(new Date(t.date), 'MMM dd, yyyy')} | ${t.branch} | ${t.type} | ${t.description} | Rs. ${t.amount.toLocaleString()}`
).join('\n')}

=============================
Total Income: Rs. ${filteredTransactions.filter(t => t.isPositive).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
Total Outflow: Rs. ${filteredTransactions.filter(t => !t.isPositive).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
`;

    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hostel-report-${format(new Date(), 'yyyy-MM-dd')}.pdf.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    // Summary sheet
    let csvContent = 'HOSTEL ERP - FINANCIAL REPORT\n\n';
    csvContent += 'SUMMARY\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Tenants,${stats.totalTenants}\n`;
    csvContent += `Occupied Beds,${stats.occupiedBeds}\n`;
    csvContent += `Available Beds,${stats.availableBeds}\n`;
    csvContent += `Total Revenue,${stats.revenue}\n`;
    csvContent += `Total Expenses,${stats.expenses}\n`;
    csvContent += `Net Balance,${stats.netBalance}\n`;
    csvContent += `Total Refund Amount,${stats.refundAmount}\n`;
    csvContent += '\n';
    csvContent += 'TRANSACTION DETAILS\n';
    csvContent += 'Date,Branch,Type,Description,Amount\n';
    
    filteredTransactions.forEach(t => {
      csvContent += `${format(new Date(t.date), 'yyyy-MM-dd')},${t.branch},${t.type},"${t.description}",${t.isPositive ? '' : '-'}${t.amount}\n`;
    });

    csvContent += '\n';
    csvContent += `Total Income,${filteredTransactions.filter(t => t.isPositive).reduce((sum, t) => sum + t.amount, 0)}\n`;
    csvContent += `Total Outflow,${filteredTransactions.filter(t => !t.isPositive).reduce((sum, t) => sum + t.amount, 0)}\n`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hostel-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Create transactions table data
  const transactions = useMemo(() => {
    const allTransactions = [];

    // Add payments
    filteredData.payments.forEach(p => {
      const tenant = tenants.find(t => t.tenantId === p.tenantId);
      const branch = branches.find(b => b.branchId === p.branchId);
      allTransactions.push({
        id: p.paymentId,
        date: p.paymentDate,
        branch: branch?.name || 'Unknown',
        branchId: p.branchId,
        type: 'Payment',
        description: `Payment by ${tenant?.name || 'Unknown'} - ${p.paymentMode} (${p.month} ${p.year})`,
        tenantName: tenant?.name || '',
        amount: p.amount,
        isPositive: true,
      });
    });

    // Add expenses
    filteredData.expenses.forEach(e => {
      const branch = branches.find(b => b.branchId === e.branchId);
      const isRefund = e.title?.toLowerCase().includes('refund');
      allTransactions.push({
        id: e.expenseId,
        date: e.expenseDate,
        branch: branch?.name || 'Unknown',
        branchId: e.branchId,
        type: isRefund ? 'Refund' : 'Expense',
        description: e.title || e.description || 'Expense',
        tenantName: isRefund ? (e.title?.replace('Refund - ', '') || '') : '',
        amount: e.amount,
        isPositive: false,
      });
    });

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return allTransactions;
  }, [filteredData, tenants, branches]);

  // Filter transactions by search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.description.toLowerCase().includes(query) ||
      t.branch.toLowerCase().includes(query) ||
      t.tenantName.toLowerCase().includes(query) ||
      t.type.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <FileBarChart className="h-7 w-7 text-blue-500" />
              Reports
            </h1>
            <p className="text-slate-500 mt-1">Generate and analyze financial reports</p>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Branch Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Branch
                </Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger data-testid="branch-filter">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.branchId} value={branch.branchId}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="start-date"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  End Date
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="end-date"
                />
              </div>

              {/* Generate Button */}
              <div className="space-y-2">
                <Label className="invisible">Action</Label>
                <Button
                  onClick={handleGenerateReport}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                  disabled={generating}
                  data-testid="generate-report-btn"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileBarChart className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                <span className="font-medium">Active Filters:</span>{' '}
                {selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.branchId === selectedBranch)?.name}
                {startDate && ` | From: ${format(new Date(startDate), 'MMM dd, yyyy')}`}
                {endDate && ` | To: ${format(new Date(endDate), 'MMM dd, yyyy')}`}
              </p>
              {reportGenerated && (
                <div className="flex gap-2">
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    data-testid="export-pdf-btn"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    data-testid="export-excel-btn"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Dashboard - Stats Cards */}
        {reportGenerated && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="report-stats">
              {/* Total Tenants */}
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Tenants</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalTenants}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Occupied Beds */}
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Occupied Beds</p>
                      <p className="text-3xl font-bold mt-1">{stats.occupiedBeds}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Bed className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Beds */}
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-teal-100 text-sm font-medium">Available Beds</p>
                      <p className="text-3xl font-bold mt-1">{stats.availableBeds}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Bed className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Revenue */}
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold mt-1">₹{stats.revenue.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Expenses */}
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                      <p className="text-3xl font-bold mt-1">₹{stats.expenses.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <TrendingDown className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Net Balance */}
              <Card className={`bg-gradient-to-br ${stats.netBalance >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-rose-500 to-rose-600'} text-white overflow-hidden relative`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${stats.netBalance >= 0 ? 'text-emerald-100' : 'text-rose-100'} text-sm font-medium`}>Net Balance</p>
                      <p className="text-3xl font-bold mt-1">₹{stats.netBalance.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wallet className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Refund Amount */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Refund Amount</p>
                      <p className="text-3xl font-bold mt-1">₹{stats.refundAmount.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card data-testid="report-table">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="text-lg">Transaction Details</CardTitle>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search tenant, branch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="search-box"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-y border-slate-200 text-sm font-medium text-slate-600">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Branch</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>

                {/* Table Body with Scroll */}
                <ScrollArea className="h-[400px]">
                  <div className="divide-y divide-slate-100">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center text-sm"
                        >
                          <div className="col-span-2 text-slate-600">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="col-span-2">
                            <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-700 text-xs font-medium">
                              {transaction.branch}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              transaction.type === 'Payment' 
                                ? 'bg-green-100 text-green-700' 
                                : transaction.type === 'Refund'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {transaction.type}
                            </span>
                          </div>
                          <div className="col-span-4 text-slate-700 truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                          <div className={`col-span-2 text-right font-semibold ${
                            transaction.isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <span className="flex items-center justify-end gap-1">
                              {transaction.isPositive ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              ₹{transaction.amount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-12 text-center text-slate-500">
                        <FileBarChart className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-medium">No transactions found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Table Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Showing {filteredTransactions.length} transactions
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <ArrowUpRight className="h-4 w-4" />
                      Income: ₹{filteredTransactions.filter(t => t.isPositive).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <ArrowDownRight className="h-4 w-4" />
                      Outflow: ₹{filteredTransactions.filter(t => !t.isPositive).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Initial State - Before Generate */}
        {!reportGenerated && (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="py-16 text-center">
              <FileBarChart className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Generate Report</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Select your filters above and click "Generate Report" to view financial statistics and transaction details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
