import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Users, Briefcase, Tag } from 'lucide-react';

interface PhoneMobileStatsProps {
  total: number;
  byCategory: Record<string, number>;
}

const PhoneMobileStats: React.FC<PhoneMobileStatsProps> = ({
  total,
  byCategory,
}) => {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Phone,
      color: 'text-primary',
    },
    {
      label: 'Employees',
      value: byCategory['Employee'] || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Clients',
      value: byCategory['Client'] || 0,
      icon: Briefcase,
      color: 'text-yellow-600',
    },
    {
      label: 'Other',
      value: Object.entries(byCategory)
        .filter(([key]) => key !== 'Employee' && key !== 'Client')
        .reduce((sum, [_, count]) => sum + count, 0),
      icon: Tag,
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

export default PhoneMobileStats;
