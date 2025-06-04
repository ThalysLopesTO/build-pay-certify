
import React from 'react';
import { Clock } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';

const TimesheetHeader = () => {
  return (
    <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
      <CardTitle className="flex items-center space-x-2">
        <Clock className="h-6 w-6" />
        <span>Weekly Timesheet</span>
      </CardTitle>
      <p className="text-orange-100">Submit your weekly hours</p>
    </CardHeader>
  );
};

export default TimesheetHeader;
