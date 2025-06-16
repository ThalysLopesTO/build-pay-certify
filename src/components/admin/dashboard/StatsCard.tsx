
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  bgColor: string;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  isLoading = false 
}) => {
  return (
    <Card className={`${bgColor} border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : value}
            </p>
          </div>
          <div className="text-4xl opacity-80">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
