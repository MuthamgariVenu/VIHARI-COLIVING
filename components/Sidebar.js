'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Building2, DoorOpen, Bed, Users, UserCog, Receipt, Wallet, UsersRound, MessageSquare, LogOut, X, Bell, Database, KeyRound, FileBarChart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminRoutes = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/branches', label: 'Branches', icon: Building2 },
  { href: '/admin/rooms', label: 'Rooms & Beds', icon: DoorOpen },
  { href: '/admin/managers', label: 'Managers', icon: UserCog },
  { href: '/admin/tenants', label: 'Tenants', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: Receipt },
  { href: '/admin/expenses', label: 'Expenses', icon: Wallet },
  { href: '/admin/employees', label: 'Employees', icon: UsersRound },
  { href: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
  { href: '/admin/exits', label: 'Exit Requests', icon: LogOut },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { href: '/admin/alerts', label: 'Alerts', icon: Bell },
  { href: '/admin/password-reset', label: 'Password Reset', icon: KeyRound },
  { href: '/admin/backup', label: 'Database Backup', icon: Database },
];

const managerRoutes = [
  { href: '/manager', label: 'Dashboard', icon: Home },
  { href: '/manager/rooms', label: 'Rooms & Beds', icon: DoorOpen },
  { href: '/manager/tenants', label: 'Tenants', icon: Users },
  { href: '/manager/payments', label: 'Payments', icon: Receipt },
  { href: '/manager/expenses', label: 'Expenses', icon: Wallet },
  { href: '/manager/employees', label: 'Employees', icon: UsersRound },
  { href: '/manager/complaints', label: 'Complaints', icon: MessageSquare },
  { href: '/manager/exits', label: 'Exit Requests', icon: LogOut },
  { href: '/manager/branch-details', label: 'Branch Details', icon: Settings },
  { href: '/manager/alerts', label: 'Alerts', icon: Bell },
];

const tenantRoutes = [
  { href: '/tenant', label: 'Dashboard', icon: Home },
  { href: '/tenant/payments', label: 'My Payments', icon: Receipt },
  { href: '/tenant/complaints', label: 'Complaints', icon: MessageSquare },
  { href: '/tenant/exit', label: 'Exit Request', icon: LogOut },
];

export function Sidebar({ role, onClose }) {
  const pathname = usePathname();
  const router = useRouter();

  let routes = [];
  if (role === 'ADMIN') routes = adminRoutes;
  else if (role === 'MANAGER') routes = managerRoutes;
  else if (role === 'TENANT') routes = tenantRoutes;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Hostel ERP
          </h2>
          <p className="text-xs text-slate-400 mt-1">{role} Panel</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden text-white">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href;
          return (
            <Link key={route.href} href={route.href} onClick={onClose}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {route.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}