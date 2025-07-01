
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  bgColor: string;
  borderColor?: string;
  iconBg?: string;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  borderColor = 'border-gray-200',
  iconBg = 'bg-gray-100',
  isLoading = false 
}) => {
  return (
    <Card className={`${bgColor} ${borderColor} border shadow-sm hover:shadow-md transition-all duration-200 rounded-xl`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : value}
            </p>
          </div>
          <div className={`p-3 rounded-full ${iconBg}`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
