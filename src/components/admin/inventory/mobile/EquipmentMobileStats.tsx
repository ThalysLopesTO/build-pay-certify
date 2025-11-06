import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface EquipmentMobileStatsProps {
  total: number;
  assigned: number;
  available: number;
  overdue: number;
}

const EquipmentMobileStats: React.FC<EquipmentMobileStatsProps> = ({
  total,
  assigned,
  available,
  overdue,
}) => {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Package,
      color: 'text-primary',
    },
    {
      label: 'Assigned',
      value: assigned,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'Available',
      value: available,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EquipmentMobileStats;
