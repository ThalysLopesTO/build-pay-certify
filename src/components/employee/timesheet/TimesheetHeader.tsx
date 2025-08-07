import React from 'react';
import { Clock } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface TimesheetHeaderProps {
  title: string;
  subtitle?: string;
}

const TimesheetHeader = ({ title, subtitle }: TimesheetHeaderProps) => {
  return (
    <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
      <CardTitle className="flex items-center justify-between">
        <span className="flex items-center space-x-2">
          <Clock className="h-6 w-6" />
          <span>{title}</span>
        </span>
        {subtitle && (
          <span className="text-sm opacity-90">{subtitle}</span>
        )}
      </CardTitle>
    </CardHeader>
  );
};

export default TimesheetHeader;
