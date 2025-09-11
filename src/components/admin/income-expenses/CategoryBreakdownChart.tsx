import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRangeType } from '@/hooks/useDateRangeFilter';
// Removed TransactionTypeFilter import as it no longer exists
import { getCategoryColor, getSubcategoryColor } from '@/utils/categoryColors';
import { format, startOfMonth } from 'date-fns';

interface CategoryBreakdownChartProps {
  transactions: TransactionWithHierarchy[];
  dateRangeType: DateRangeType;
  onDateRangeChange: (range: DateRangeType) => void;
  transactionTypeFilter: string[];
  onTransactionTypeChange: (types: string[]) => void;
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

  // Process data for Monthly Breakdown by Parent Category (last 4 months)
  const chartData = React.useMemo(() => {
    // Get last 4 months
    const last4Months = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        date: startOfMonth(date),
        key: format(startOfMonth(date), 'yyyy-MM'),
        label: format(startOfMonth(date), 'MMM yyyy')
      };
    }).reverse();

    // Filter transactions by type
    const typeFilteredTransactions = transactions.filter(transaction => {
      if (transactionTypeFilter.length === 0) {
        // Default to expenses when showing nothing selected
        return transaction.transaction_type === 'expense';
      }
      return transactionTypeFilter.includes(transaction.transaction_type);
    });

    // Group transactions by month and category
    const monthlyData = last4Months.map(month => {
      const monthTransactions = typeFilteredTransactions.filter(transaction => {
        const transactionMonth = format(startOfMonth(new Date(transaction.expense_date)), 'yyyy-MM');
        return transactionMonth === month.key;
      });

      // Group by category (parent or subcategory based on toggle)
      const categoryMap = new Map<string, { amount: number; categoryId: string; categoryName: string }>();

      monthTransactions.forEach(transaction => {
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

      // Convert to chart format
      const monthData: { [key: string]: number | string } = { month: month.label };
      
      Array.from(categoryMap.values()).forEach(category => {
        monthData[category.categoryName] = category.amount;
      });

      return monthData;
    });

    return monthlyData;
  }, [transactions, transactionTypeFilter, getCategoryDisplay, showSubcategories]);

  // Get categories for legend and bars (collect from ALL months, not just first)
  const categories = React.useMemo(() => {
    const allCategories = new Set<string>();
    
    chartData.forEach(monthData => {
      Object.keys(monthData).forEach(key => {
        if (key !== 'month') {
          allCategories.add(key);
        }
      });
    });
    
    return Array.from(allCategories).sort();
  }, [chartData]);

  const getChartTitle = () => {
    if (transactionTypeFilter.length === 1) {
      if (transactionTypeFilter.includes('income')) {
        return 'Monthly Breakdown by Income Category';
      } else if (transactionTypeFilter.includes('expense')) {
        return 'Monthly Breakdown by Expense Category';
      }
    }
    return 'Monthly Breakdown by Categories';
  };

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {getChartTitle()}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubcategories(!showSubcategories)}
            className="text-xs h-7 border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            {showSubcategories ? 'Hide' : 'Show'} Subcategories
          </Button>
        </div>

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