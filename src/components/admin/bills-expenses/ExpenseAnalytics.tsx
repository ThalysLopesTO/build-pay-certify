import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { format, parseISO, startOfMonth } from 'date-fns';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface BillExpense {
  id: string;
  expense_title: string;
  category_name: string;
  vendor_payee: string;
  expense_date: string;
  amount: number;
  payment_status: 'paid' | 'unpaid' | 'scheduled';
  payment_method?: string;
  notes?: string;
  attachment_url?: string;
  is_recurring?: boolean;
  recurrence_frequency?: string;
  parent_recurring_bill_id?: string;
}

interface ExpenseAnalyticsProps {
  expenses: BillExpense[];
}

interface MonthlyData {
  month: string;
  total: number;
  [category: string]: string | number;
}

const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({ expenses }) => {
  // Process data for monthly expenses chart
  const monthlyExpenses = React.useMemo(() => {
    const monthMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const monthKey = format(startOfMonth(parseISO(expense.expense_date)), 'MMM yyyy');
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + expense.amount);
    });

    return Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months
  }, [expenses]);

  // Process data for monthly breakdown by category
  const monthlyBreakdown = React.useMemo(() => {
    const monthMap = new Map<string, Record<string, number>>();
    const categoriesSet = new Set<string>();

    expenses.forEach(expense => {
      const monthKey = format(startOfMonth(parseISO(expense.expense_date)), 'MMM yyyy');
      const category = expense.category_name || 'Uncategorized';
      
      categoriesSet.add(category);
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {});
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData[category] = (monthData[category] || 0) + expense.amount;
    });

    const categories = Array.from(categoriesSet);
    
    return Array.from(monthMap.entries())
      .map(([month, categoryData]) => ({
        month,
        ...categoryData,
        total: Object.values(categoryData).reduce((sum, value) => sum + value, 0)
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months
  }, [expenses]);

  const categories = React.useMemo(() => {
    return Array.from(new Set(expenses.map(e => e.category_name || 'Uncategorized')));
  }, [expenses]);

  // Color palette for categories - using HSL colors from design system
  const categoryColors = [
    'hsl(221, 83%, 53%)', // Primary blue
    'hsl(262, 83%, 58%)', // Purple
    'hsl(142, 76%, 36%)', // Green
    'hsl(346, 77%, 49%)', // Pink
    'hsl(24, 95%, 53%)',  // Orange
    'hsl(38, 92%, 50%)',  // Yellow
    'hsl(199, 89%, 48%)', // Cyan
    'hsl(158, 64%, 52%)', // Teal
  ];

  const chartConfig = {
    total: {
      label: "Total Amount",
      color: "hsl(var(--primary))",
    },
    ...categories.reduce((acc, category, index) => {
      acc[category] = {
        label: category,
        color: categoryColors[index % categoryColors.length],
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>)
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'total' ? 'Total' : entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">Expense Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            No expense data available for analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Monthly Expenses Chart */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">Monthly Expenses</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  className="fill-current"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Breakdown by Category Chart */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">Monthly Breakdown by Category</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<CustomTooltip />} />
                <Legend 
                  content={<ChartLegendContent />}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                {categories.map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="category"
                    fill={categoryColors[index % categoryColors.length]}
                    radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseAnalytics;