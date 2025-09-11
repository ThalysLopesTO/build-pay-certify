import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRangeType, DateRange } from '@/hooks/useDateRangeFilter';
// Removed TransactionTypeFilter import as it no longer exists

interface MonthlyCashFlowChartProps {
  transactions: TransactionWithHierarchy[];
  dateRangeType: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  transactionTypeFilter: string[];
  onTransactionTypeChange: (types: string[]) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
}

export const MonthlyCashFlowChart: React.FC<MonthlyCashFlowChartProps> = ({
  transactions,
  dateRangeType,
  onDateRangeChange,
  transactionTypeFilter,
  onTransactionTypeChange,
  customRange,
  onCustomRangeChange,
}) => {
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(customRange.start || undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(customRange.end || undefined);

  // Colors for income vs expenses (overall trend chart)
  const INCOME_COLOR = 'hsl(142, 76%, 36%)'; // Green
  const EXPENSE_COLOR = 'hsl(346, 77%, 49%)'; // Red/Pink

  // Process data for Overall Monthly Cash Flow (left chart)
  const chartData = React.useMemo(() => {
    const monthMap = new Map<string, { income: number; expenses: number }>();

    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return format(date, 'MMM yyyy');
    }).reverse();

    // Initialize all months with zero values
    last12Months.forEach(month => {
      monthMap.set(month, { income: 0, expenses: 0 });
    });

    // Aggregate data by month
    transactions.forEach(transaction => {
      const monthKey = format(new Date(transaction.expense_date), 'MMM yyyy');
      if (monthMap.has(monthKey)) {
        const monthData = monthMap.get(monthKey)!;
        if (transaction.transaction_type === 'income') {
          monthData.income += transaction.amount;
        } else {
          monthData.expenses += transaction.amount;
        }
      }
    });

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
    }));
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

  // Render bars based on transaction type filter
  const renderBars = () => {
    if (transactionTypeFilter.length === 1 && transactionTypeFilter.includes('income')) {
      return (
        <Bar 
          dataKey="income" 
          fill={INCOME_COLOR}
          name="Income"
          radius={[4, 4, 0, 0]}
        />
      );
    } else if (transactionTypeFilter.length === 1 && transactionTypeFilter.includes('expense')) {
      return (
        <Bar 
          dataKey="expenses" 
          fill={EXPENSE_COLOR}
          name="Expenses"
          radius={[4, 4, 0, 0]}
        />
      );
    } else {
      // Show both income and expenses as grouped bars
      return (
        <>
          <Bar 
            dataKey="income" 
            fill={INCOME_COLOR}
            name="Income"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill={EXPENSE_COLOR}
            name="Expenses"
            radius={[4, 4, 0, 0]}
          />
        </>
      );
    }
  };

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Overall Monthly Cash Flow
        </CardTitle>
        
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
              {(transactionTypeFilter.length === 0 || transactionTypeFilter.length > 1) && (
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