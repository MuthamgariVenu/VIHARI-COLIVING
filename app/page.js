'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authAPI } from '@/lib/api';
import { Building2, MapPin, Phone, Users, Zap, Globe, ChevronDown, Shield, LayoutDashboard, User } from 'lucide-react';

export default function HomePage() {
  const [branches, setBranches] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    loadBranches();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data.filter(b => b.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const openLoginWithRole = (selectedRole) => {
    setRole(selectedRole);
    setIsDropdownOpen(false);
    setIsLoginOpen(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(mobile, password, role);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Check if password change is required (for Manager and Tenant only)
      if (response.user.forcePasswordChange && (role === 'MANAGER' || role === 'TENANT')) {
        router.push('/change-password');
        return;
      }

      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'MANAGER') router.push('/manager');
      else if (role === 'TENANT') router.push('/tenant');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Hostel ERP</span>
            </div>

            {/* Login Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40"
              >
                Login
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => openLoginWithRole('ADMIN')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-blue-400" />
                    Admin Login
                  </button>
                  <button
                    onClick={() => openLoginWithRole('MANAGER')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors border-t border-slate-700"
                  >
                    <LayoutDashboard className="h-5 w-5 text-green-400" />
                    Manager Login
                  </button>
                  <button
                    onClick={() => openLoginWithRole('TENANT')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors border-t border-slate-700"
                  >
                    <User className="h-5 w-5 text-purple-400" />
                    Tenant Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-slate-300">Complete Hostel Management Solution</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Hostel Management</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ERP System
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Streamline your hostel operations with our powerful management platform. 
            Track tenants, payments, rooms, and more in one place.
          </p>
          
          <Button
            onClick={() => setIsLoginOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-6 text-lg rounded-full shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
          >
            Login Now
          </Button>
        </div>
      </section>

      {/* Branches Section */}
      {branches.length > 0 && (
        <section className="py-20 px-6 bg-slate-800/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Our Branches</h2>
              <p className="text-lg text-slate-400">Find a hostel location near you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {branches.map((branch, index) => (
                <Card 
                  key={branch.branchId} 
                  className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 overflow-hidden group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-center h-full">
                      <Building2 className="h-20 w-20 text-slate-600 group-hover:text-slate-500 transition-colors duration-500" />
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{branch.name}</h3>
                      <p className="text-sm text-slate-500">Code: {branch.code}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-400">{branch.address}</p>
                        <p className="text-sm font-medium text-slate-300">{branch.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-400" />
                      <p className="text-sm text-slate-400">{branch.phone}</p>
                    </div>
                    {branch.facilities && branch.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {branch.facilities.slice(0, 3).map((facility, idx) => (
                          <span key={idx} className="text-xs bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">
                            {facility}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={() => router.push(`/branch/${branch.branchId}`)}
                      className="w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white border border-blue-500/30 hover:border-blue-500/50 rounded-xl mt-4 transition-all"
                      data-testid={`branch-details-btn-${index}`}
                    >
                      View Details
                      <ChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Us?</h2>
            <p className="text-lg text-slate-400">Powerful features for complete hostel management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-slate-700 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Multi-Role System</h3>
                <p className="text-slate-400 leading-relaxed">
                  Admin, Manager & Tenant dashboards with role-based access control for secure operations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-slate-700 hover:border-green-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-110">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Real-Time Sync</h3>
                <p className="text-slate-400 leading-relaxed">
                  All modules stay synchronized across the system with instant updates and notifications.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-slate-700 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
                  <Globe className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Multi-Branch</h3>
                <p className="text-slate-400 leading-relaxed">
                  Manage multiple hostel branches from a single dashboard with unified reporting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Hostel ERP</span>
          </div>
          <p className="text-slate-500">© 2024 Hostel ERP. All rights reserved.</p>
          <p className="text-slate-600 text-sm mt-2">Professional Hostel Management System</p>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-white">Welcome Back</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-5 mt-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Login As</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ADMIN" className="text-white hover:bg-slate-700">Admin</SelectItem>
                  <SelectItem value="MANAGER" className="text-white hover:bg-slate-700">Manager</SelectItem>
                  <SelectItem value="TENANT" className="text-white hover:bg-slate-700">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter 10 digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 rounded-xl shadow-lg shadow-blue-500/25"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
