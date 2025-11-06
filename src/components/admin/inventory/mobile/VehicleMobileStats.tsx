import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, CheckCircle, Wrench, MapPin } from 'lucide-react';

interface VehicleMobileStatsProps {
  total: number;
  active: number;
  maintenance: number;
  unassigned: number;
}

const VehicleMobileStats: React.FC<VehicleMobileStatsProps> = ({
  total,
  active,
  maintenance,
  unassigned,
}) => {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Car,
      color: 'text-primary',
    },
    {
      label: 'Active',
      value: active,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      label: 'Maintenance',
      value: maintenance,
      icon: Wrench,
      color: 'text-orange-600',
    },
    {
      label: 'Unassigned',
      value: unassigned,
      icon: MapPin,
      color: 'text-gray-600',
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

export default VehicleMobileStats;
