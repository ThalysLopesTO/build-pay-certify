
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
  onClick?: () => void;
  linkTo?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  borderColor = 'border-gray-200',
  iconBg = 'bg-gray-100',
  isLoading = false,
  onClick,
  linkTo,
  trend
}) => {
  const cardClasses = [
    bgColor,
    borderColor,
    'border',
    'shadow-sm',
    'hover:shadow-lg',
    'transition-all',
    'duration-200',
    'rounded-xl',
    onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
  ].join(' ');

  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <Card className={cardClasses} onClick={handleClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '...' : value}
              </p>
              
              {trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  trend.isPositive ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                }`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}%
                </span>
              )}
            </div>
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
