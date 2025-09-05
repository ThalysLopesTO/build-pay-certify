import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TrendingUp, BarChart3, Clock, Users } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { usePayrollAnalytics, getDefaultMonthRange } from '@/hooks/usePayrollAnalytics';

interface PayrollEntry {
  monthYear: string;
  employeeName: string;
  totalHours: number;
  grossPay: number;
  totalPayWithTax: number;
}

interface MonthlyPayrollAnalyticsProps {
  payrollEntries: PayrollEntry[];
  taxIncluded: boolean;
}

const formatYAxisCurrency = (value: number) => {
  if (value === 0) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
};

const formatNumber = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
};

const calculateMoMChange = (data: any[], currentIndex: number, metric: string) => {
  if (currentIndex === 0 || !data[currentIndex - 1]) return null;
  
  const current = data[currentIndex][metric];
  const previous = data[currentIndex - 1][metric];
  
  if (previous === 0) return null;
  
  const change = ((current - previous) / previous) * 100;
  return change;
};

export const MonthlyPayrollAnalytics: React.FC<MonthlyPayrollAnalyticsProps> = ({
  payrollEntries,
  taxIncluded,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<string[]>(['amount']);
  
  const analyticsData = usePayrollAnalytics(payrollEntries, taxIncluded);
  
  // Use default 12-month range if no data or merge with existing data
  const chartData = React.useMemo(() => {
    if (analyticsData.length === 0) {
      return getDefaultMonthRange();
    }
    
    // If we have filtered data, just return it as-is
    return analyticsData;
  }, [analyticsData]);

  const handleSeriesToggle = (value: string[]) => {
    if (value.length > 0) {
      setSelectedSeries(value);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const monthIndex = chartData.findIndex(item => item.month === label);
    const momChange = calculateMoMChange(chartData, monthIndex, 'totalAmount');

    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          if (!selectedSeries.includes(entry.dataKey.replace('total', '').toLowerCase().replace('employees', 'employees'))) {
            return null;
          }
          
          let formattedValue = '';
          if (entry.dataKey === 'totalAmount') {
            formattedValue = formatCurrency(entry.value);
          } else if (entry.dataKey === 'totalHours') {
            formattedValue = `${entry.value.toLocaleString()} hrs`;
          } else {
            formattedValue = `${entry.value} employees`;
          }

          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-medium text-foreground">{formattedValue}</span>
            </div>
          );
        })}
        {momChange !== null && selectedSeries.includes('amount') && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {momChange > 0 ? '▲' : '▼'} {Math.abs(momChange).toFixed(1)}% vs prior month
            </span>
          </div>
        )}
      </div>
    );
  };

  const getLegendPayload = () => {
    const items = [];
    if (selectedSeries.includes('amount')) {
      items.push({ value: 'Total Amount', type: 'rect', color: 'hsl(var(--chart-1))' });
    }
    if (selectedSeries.includes('hours')) {
      items.push({ value: 'Total Hours', type: 'line', color: 'hsl(var(--chart-2))' });
    }
    if (selectedSeries.includes('employees')) {
      items.push({ value: 'Active Employees', type: 'line', color: 'hsl(var(--chart-3))' });
    }
    return items;
  };

  if (!payrollEntries || payrollEntries.length === 0) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="flex flex-col items-center justify-center h-80 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No approved timesheets</h3>
          <p className="text-muted-foreground">No approved timesheets for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Monthly Payroll (Approved)</h3>
            <p className="text-sm text-muted-foreground">Amount, Hours & Headcount</p>
          </div>
        </div>
        <ToggleGroup
          type="multiple"
          value={selectedSeries}
          onValueChange={handleSeriesToggle}
          className="gap-1"
        >
          <ToggleGroupItem value="amount" size="sm" className="h-8 px-3">
            Amount
          </ToggleGroupItem>
          <ToggleGroupItem value="hours" size="sm" className="h-8 px-3">
            Hours
          </ToggleGroupItem>
          <ToggleGroupItem value="employees" size="sm" className="h-8 px-3">
            Employees
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="currency"
                orientation="left"
                tickFormatter={formatYAxisCurrency}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax']}
              />
              <YAxis 
                yAxisId="number"
                orientation="right"
                tickFormatter={formatNumber}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                payload={getLegendPayload()}
                wrapperStyle={{ paddingTop: '20px' }}
              />
              
              {selectedSeries.includes('amount') && (
                <Bar
                  yAxisId="currency"
                  dataKey="totalAmount"
                  name="Total Amount"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              )}
              
              {selectedSeries.includes('hours') && (
                <Line
                  yAxisId="number"
                  type="monotone"
                  dataKey="totalHours"
                  name="Total Hours"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {selectedSeries.includes('employees') && (
                <Line
                  yAxisId="number"
                  type="monotone"
                  dataKey="activeEmployees"
                  name="Active Employees"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};