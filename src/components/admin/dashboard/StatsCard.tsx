
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  count: number | string;
  icon: LucideIcon;
  description?: string;
  onClick?: () => void;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon: Icon,
  description,
  onClick,
  loading = false
}) => {
  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {loading ? '...' : count}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
