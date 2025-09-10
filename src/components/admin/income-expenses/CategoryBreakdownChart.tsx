import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRangeType } from '@/hooks/useDateRangeFilter';
import { TransactionTypeFilter } from '@/hooks/useTransactionFilters';
import { getCategoryColor, getSubcategoryColor } from '@/utils/categoryColors';
import { format, startOfMonth } from 'date-fns';

interface CategoryBreakdownChartProps {
  transactions: TransactionWithHierarchy[];
  dateRangeType: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  transactionTypeFilter: TransactionTypeFilter;
  onTransactionTypeChange: (type: TransactionTypeFilter) => void;
  getCategoryDisplay: (categoryId: string) => string;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  transactions,
  dateRangeType,
  onDateRangeChange,
  transactionTypeFilter,
  onTransactionTypeChange,
  getCategoryDisplay,
}) => {
  const [showSubcategories, setShowSubcategories] = useState(false);

  // Process data for Monthly Breakdown by Parent Category (right chart)
  const chartData = React.useMemo(() => {
    // Get current month for breakdown
    const now = new Date();
    const currentMonth = format(startOfMonth(now), 'yyyy-MM');

    // Filter transactions for current month and type
    const filteredTransactions = transactions.filter(transaction => {
      const transactionMonth = format(startOfMonth(new Date(transaction.expense_date)), 'yyyy-MM');
      const matchesMonth = transactionMonth === currentMonth;
      
      if (transactionTypeFilter === 'all') {
        // Default to expenses when showing "All" (like original)
        return matchesMonth && transaction.transaction_type === 'expense';
      }
      return matchesMonth && transaction.transaction_type === transactionTypeFilter;
    });

    // Group by category (parent or subcategory based on toggle)
    const categoryMap = new Map<string, { amount: number; categoryId: string; categoryName: string }>();

    filteredTransactions.forEach(transaction => {
      let categoryKey: string;
      let categoryName: string;
      
      if (showSubcategories && transaction.subcategory_name) {
        // Show subcategories with parent > sub format
        categoryKey = `${transaction.category_id}_${transaction.subcategory_name}`;
        categoryName = `${transaction.parent_category_name} > ${transaction.subcategory_name}`;
      } else {
        // Show parent categories only
        categoryKey = transaction.category_id;
        categoryName = transaction.parent_category_name || getCategoryDisplay(transaction.category_id);
      }

      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          amount: 0,
          categoryId: transaction.category_id,
          categoryName
        });
      }

      const categoryData = categoryMap.get(categoryKey)!;
      categoryData.amount += transaction.amount;
    });

    // Convert to stacked bar chart format
    const categories = Array.from(categoryMap.values());
    const monthData: { [key: string]: number | string } = { month: format(now, 'MMM yyyy') };
    
    categories.forEach(category => {
      monthData[category.categoryName] = category.amount;
    });

    return [monthData];
  }, [transactions, transactionTypeFilter, getCategoryDisplay, showSubcategories]);

  // Get categories for legend and bars
  const categories = React.useMemo(() => {
    if (chartData.length === 0) return [];
    
    const data = chartData[0];
    return Object.keys(data).filter(key => key !== 'month');
  }, [chartData]);

  const getChartTitle = () => {
    if (transactionTypeFilter === 'income') {
      return 'Monthly Breakdown by Income Category';
    } else if (transactionTypeFilter === 'expense') {
      return 'Monthly Breakdown by Expense Category';
    } else {
      return 'Monthly Breakdown by Parent Category';
    }
  };

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">{getChartTitle()}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubcategories(!showSubcategories)}
            className="text-xs h-7 border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            {showSubcategories ? 'Hide' : 'Show'} Subcategories
          </Button>
        </div>

        {/* Time Range Tabs */}
        <Tabs value={dateRangeType} onValueChange={(value) => onDateRangeChange(value as DateRangeType)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8 bg-slate-100">
            <TabsTrigger value="this-month" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">This Month</TabsTrigger>
            <TabsTrigger value="last-month" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Last Month</TabsTrigger>
            <TabsTrigger value="year-to-date" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">YTD</TabsTrigger>
            <TabsTrigger value="all-time" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">All-Time</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Custom</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transaction Type Tabs */}
        <Tabs value={transactionTypeFilter} onValueChange={(value) => onTransactionTypeChange(value as TransactionTypeFilter)} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3 h-8 bg-slate-100">
            <TabsTrigger value="all" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">All</TabsTrigger>
            <TabsTrigger value="expense" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Expenses</TabsTrigger>
            <TabsTrigger value="income" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Income</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 11 }}
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
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              {/* Render stacked bars for each category */}
              {categories.map((category, index) => {
                // Get category ID for consistent coloring
                const categoryId = category.split(' >')[0]; // Get parent category for color
                const color = getCategoryColor(categoryId, category);
                const finalColor = showSubcategories && category.includes(' > ') 
                  ? getSubcategoryColor(color) 
                  : color;
                
                return (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="category"
                    fill={finalColor}
                    radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};