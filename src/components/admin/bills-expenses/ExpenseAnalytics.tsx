import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { format, parseISO, startOfMonth } from 'date-fns';
import { TrendingUp, BarChart3, BarChart4 } from 'lucide-react';
import { ExpenseWithHierarchy } from '@/hooks/useHierarchicalCategories';

interface ExpenseAnalyticsProps {
  expenses: ExpenseWithHierarchy[];
}

interface MonthlyData {
  month: string;
  total: number;
  [category: string]: string | number;
}

const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({ expenses }) => {
  const [breakdownBy, setBreakdownBy] = useState<'parent' | 'subcategory'>('parent');
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
      
      let categoryKey: string;
      if (breakdownBy === 'parent') {
        categoryKey = expense.parent_category_name || 'Uncategorized';
      } else {
        // For subcategory view, show as "Parent > Subcategory" or just "Parent" if no subcategory
        if (expense.subcategory_name) {
          categoryKey = `${expense.parent_category_name} > ${expense.subcategory_name}`;
        } else {
          categoryKey = expense.parent_category_name || 'Uncategorized';
        }
      }
      
      categoriesSet.add(categoryKey);
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {});
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData[categoryKey] = (monthData[categoryKey] || 0) + expense.amount;
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
  }, [expenses, breakdownBy]);

  const categories = React.useMemo(() => {
    return Array.from(new Set(expenses.map(expense => {
      if (breakdownBy === 'parent') {
        return expense.parent_category_name || 'Uncategorized';
      } else {
        // For subcategory view
        if (expense.subcategory_name) {
          return `${expense.parent_category_name} > ${expense.subcategory_name}`;
        } else {
          return expense.parent_category_name || 'Uncategorized';
        }
      }
    })));
  }, [expenses, breakdownBy]);

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
              <CardTitle className="text-lg font-bold text-slate-900">
                Monthly Breakdown by {breakdownBy === 'parent' ? 'Parent Category' : 'Subcategory'}
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBreakdownBy(breakdownBy === 'parent' ? 'subcategory' : 'parent')}
            >
              {breakdownBy === 'parent' ? (
                <>
                  <BarChart4 className="h-4 w-4 mr-2" />
                  Show Subcategories
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Show Parents
                </>
              )}
            </Button>
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