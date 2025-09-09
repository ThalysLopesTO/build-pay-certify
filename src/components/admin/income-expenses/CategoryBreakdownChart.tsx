import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRangeType } from '@/hooks/useDateRangeFilter';
import { TransactionTypeFilter } from '@/hooks/useTransactionFilters';

interface CategoryBreakdownChartProps {
  transactions: TransactionWithHierarchy[];
  dateRangeType: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  transactionTypeFilter: TransactionTypeFilter;
  getCategoryDisplay: (categoryId: string) => string;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  transactions,
  dateRangeType,
  onDateRangeChange,
  transactionTypeFilter,
  getCategoryDisplay,
}) => {
  const [showSubcategories, setShowSubcategories] = useState(false);

  // Process data for chart
  const chartData = React.useMemo(() => {
    // Group transactions by category
    const categoryData: { [key: string]: { amount: number; category: string; type: string } } = {};

    // Filter transactions based on type filter
    const filteredTransactions = transactions.filter(transaction => {
      if (transactionTypeFilter === 'all') {
        // For "All", show expenses by default (original behavior)
        return transaction.transaction_type === 'expense';
      }
      return transaction.transaction_type === transactionTypeFilter;
    });

    filteredTransactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      const categoryName = getCategoryDisplay(categoryId);
      
      if (!categoryData[categoryId]) {
        categoryData[categoryId] = { 
          amount: 0, 
          category: categoryName,
          type: transaction.transaction_type
        };
      }

      categoryData[categoryId].amount += transaction.amount;
    });

    // Convert to array and sort by amount
    return Object.values(categoryData)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Show top 10 categories
  }, [transactions, transactionTypeFilter, getCategoryDisplay, showSubcategories]);

  const getBarColor = () => {
    if (transactionTypeFilter === 'income') {
      return 'hsl(var(--success))';
    } else {
      return 'hsl(var(--destructive))';
    }
  };

  const getChartTitle = () => {
    if (transactionTypeFilter === 'income') {
      return 'Income by Category';
    } else if (transactionTypeFilter === 'expense') {
      return 'Expenses by Category';
    } else {
      return 'Expenses by Category';
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
        <Tabs value={dateRangeType} onValueChange={(value) => onDateRangeChange(value as DateRangeType)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8 bg-slate-100">
            <TabsTrigger value="this-month" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">This Month</TabsTrigger>
            <TabsTrigger value="last-month" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Last Month</TabsTrigger>
            <TabsTrigger value="year-to-date" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">YTD</TabsTrigger>
            <TabsTrigger value="all-time" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">All-Time</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs px-2 data-[state=active]:bg-white data-[state=active]:text-slate-900">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number"
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="category"
                className="text-xs"
                tick={{ fontSize: 11 }}
                width={75}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                labelFormatter={(label) => `Category: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="amount" 
                fill={getBarColor()}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};