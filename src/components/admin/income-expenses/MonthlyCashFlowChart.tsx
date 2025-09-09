import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRangeType, DateRange } from '@/hooks/useDateRangeFilter';
import { TransactionTypeFilter } from '@/hooks/useTransactionFilters';

interface MonthlyCashFlowChartProps {
  transactions: TransactionWithHierarchy[];
  dateRangeType: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  transactionTypeFilter: TransactionTypeFilter;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
}

export const MonthlyCashFlowChart: React.FC<MonthlyCashFlowChartProps> = ({
  transactions,
  dateRangeType,
  onDateRangeChange,
  transactionTypeFilter,
  customRange,
  onCustomRangeChange,
}) => {
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(customRange.start || undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(customRange.end || undefined);

  // Process data for chart
  const chartData = React.useMemo(() => {
    // Group transactions by month
    const monthlyData: { [key: string]: { income: number; expenses: number; month: string } } = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.expense_date);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM yyyy');

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, month: monthLabel };
      }

      if (transaction.transaction_type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        ...data,
        monthKey: key,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-12); // Show last 12 months
  }, [transactions]);

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onCustomRangeChange({
        start: startOfMonth(customStartDate),
        end: endOfMonth(customEndDate),
      });
      onDateRangeChange('custom');
      setIsCustomDateOpen(false);
    }
  };

  const renderBars = () => {
    if (transactionTypeFilter === 'income') {
      return <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />;
    } else if (transactionTypeFilter === 'expense') {
      return <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />;
    } else {
      return (
        <>
          <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />
          <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
        </>
      );
    }
  };

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900">Monthly Cash Flow</CardTitle>
        <Tabs value={dateRangeType} onValueChange={(value) => onDateRangeChange(value as DateRangeType)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8 bg-slate-100">
            <TabsTrigger value="year-to-date" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">YTD</TabsTrigger>
            <TabsTrigger value="this-month" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">This Month</TabsTrigger>
            <TabsTrigger value="last-month" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Last Month</TabsTrigger>
            <TabsTrigger value="all-time" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">All-Time</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {dateRangeType === 'custom' && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Custom Range:</span>
              <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {customRange.start && customRange.end
                      ? `${format(customRange.start, 'MMM dd')} - ${format(customRange.end, 'MMM dd, yyyy')}`
                      : 'Select dates'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Start Date</label>
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        className="rounded-md border p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">End Date</label>
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        className="rounded-md border p-2"
                      />
                    </div>
                    <Button onClick={handleCustomDateApply} size="sm" className="w-full">
                      Apply Range
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              {transactionTypeFilter === 'all' && (
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
              )}
              {renderBars()}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};