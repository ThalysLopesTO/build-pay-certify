
import React from 'react';

interface TimesheetSummaryProps {
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
}

const TimesheetSummary = ({ totalHours, hourlyRate, grossPay }: TimesheetSummaryProps) => {
  return (
    <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-sm text-slate-600">Total Hours</p>
        <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-slate-600">Hourly Rate</p>
        <p className="text-2xl font-bold text-green-600">${hourlyRate.toFixed(2)}</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-slate-600">Gross Pay</p>
        <p className="text-2xl font-bold text-orange-600">${grossPay.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default TimesheetSummary;
