'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({ title, value, icon: Icon, color = 'blue', trend }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="flex items-center">
          <div className={cn('p-6 bg-gradient-to-br', colorClasses[color])}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 p-4">
            <p className="text-sm text-slate-600 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-slate-500 mt-1">{trend}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}