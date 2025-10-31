import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
  totalCompanies: number;
  pendingApprovals: number;
  trialCompanies: number;
  expiringSoon: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalCompanies,
  pendingApprovals,
  trialCompanies,
  expiringSoon,
}) => {
  const stats = [
    {
      title: 'Total Companies',
      value: totalCompanies,
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pending Approvals',
      value: pendingApprovals,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      highlight: pendingApprovals > 0,
    },
    {
      title: 'Trial Companies',
      value: trialCompanies,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Expiring Soon',
      value: expiringSoon,
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      highlight: expiringSoon > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border shadow-md ${
            stat.highlight ? 'ring-2 ring-amber-400 ring-offset-2 animate-pulse' : ''
          }`}
        >
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
                  {stat.title}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 md:p-3 rounded-xl ${stat.bgColor} transition-transform duration-300 hover:scale-110`}>
                <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.iconColor}`} />
              </div>
            </div>
            {stat.highlight && (
              <div className="mt-3 flex items-center text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded-md">
                <AlertCircle className="h-3 w-3 mr-1" />
                Requires attention
              </div>
            )}
          </CardContent>
          <div
            className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.gradient} opacity-80`}
          />
        </Card>
      ))}
    </div>
  );
};
