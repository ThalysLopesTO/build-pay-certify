
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useWeeklyHoursSummary, DailyHours } from '@/hooks/useWeeklyHoursSummary';

const WeeklyHoursChart: React.FC = () => {
  const { data, isLoading } = useWeeklyHoursSummary();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded mb-4 w-2/3"></div>
            <div className="h-40 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-16 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    hours: {
      label: "Hours",
      color: "hsl(217, 91%, 60%)",
    },
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">This Week's Hours</h3>
          <p className="text-slate-600">Daily breakdown of hours worked</p>
        </div>
        
        <div className="mb-4 h-48">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyHours || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  className="text-slate-600 text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-slate-600 text-xs"
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                />
                <Bar 
                  dataKey="hours" 
                  fill="var(--color-hours)"
                  radius={[4, 4, 0, 0]}
                  className="fill-blue-500"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {data?.totalHours || 0}h
          </div>
          <p className="text-sm text-slate-500">total hours this week</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursChart;
