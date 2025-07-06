import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EnhancedStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  isCurrency?: boolean;
  isAlert?: boolean;
  alertLevel?: 'warning' | 'danger';
  subtitle?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

const EnhancedStatsCard: React.FC<EnhancedStatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon,
  isCurrency = false,
  isAlert = false,
  alertLevel = 'warning',
  subtitle,
  isLoading = false,
  onClick
}) => {
  const formatValue = (val: number | string) => {
    if (isLoading) return '...';
    if (isCurrency && typeof val === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  const getCardStyles = () => {
    if (isAlert && typeof value === 'number' && value > 0) {
      return alertLevel === 'danger' 
        ? 'bg-red-50 border-red-200 hover:shadow-red-100' 
        : 'bg-orange-50 border-orange-200 hover:shadow-orange-100';
    }
    return 'bg-card border-border hover:shadow-md';
  };

  const getIconStyles = () => {
    if (isAlert && typeof value === 'number' && value > 0) {
      return alertLevel === 'danger' 
        ? 'text-red-600 bg-red-100' 
        : 'text-orange-600 bg-orange-100';
    }
    return 'text-muted-foreground bg-muted';
  };

  const getValueStyles = () => {
    if (isAlert && typeof value === 'number' && value > 0) {
      return alertLevel === 'danger' ? 'text-red-900' : 'text-orange-900';
    }
    return 'text-foreground';
  };

  return (
    <Card 
      className={`${getCardStyles()} border shadow-sm hover:shadow-md transition-all duration-200 rounded-xl ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className={`text-3xl font-bold ${getValueStyles()} mb-1`}>
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${getIconStyles()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedStatsCard;