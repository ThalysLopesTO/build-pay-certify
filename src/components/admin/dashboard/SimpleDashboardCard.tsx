import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SimpleDashboardCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  onClick?: () => void;
}

const SimpleDashboardCard: React.FC<SimpleDashboardCardProps> = ({ 
  title, 
  value, 
  subtext,
  icon: Icon,
  bgColor,
  iconColor,
  onClick
}) => {
  return (
    <Card 
      className={`${bgColor} border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${iconColor}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleDashboardCard;