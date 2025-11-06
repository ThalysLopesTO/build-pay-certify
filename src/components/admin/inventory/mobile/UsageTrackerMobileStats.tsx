import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { UsageStats } from '@/types/equipment-usage';

interface UsageTrackerMobileStatsProps {
  stats: UsageStats | undefined;
}

export const UsageTrackerMobileStats: React.FC<UsageTrackerMobileStatsProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Currently Assigned',
      value: stats?.currently_assigned || 0,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Returned Today',
      value: stats?.returned_today || 0,
      icon: TrendingUp,
      gradient: 'from-green-500 to-green-600',
      iconColor: 'text-green-600',
    },
    {
      label: 'Pending Return',
      value: stats?.pending_return || 0,
      icon: Clock,
      gradient: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Damaged/Lost',
      value: stats?.damaged_lost_today || 0,
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
