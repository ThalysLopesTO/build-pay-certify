import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
// Removed TransactionTypeFilter import as it no longer exists
interface IncomeExpensesKPIsProps {
  transactions: TransactionWithHierarchy[];
  transactionTypeFilter: string[];
  getCategoryDisplay: (categoryId: string) => string;
}
export const IncomeExpensesKPIs: React.FC<IncomeExpensesKPIsProps> = ({
  transactions,
  transactionTypeFilter,
  getCategoryDisplay
}) => {
  // Calculate KPIs
  const totalInflow = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  // Calculate top categories based on transaction type filter
  const topCategories = React.useMemo(() => {
    const categoryTotals: {
      [key: string]: number;
    } = {};
    const filteredTransactions = transactions.filter(t => {
      if (transactionTypeFilter.length === 0) {
        // Show expense categories by default when nothing selected
        return t.transaction_type === 'expense';
      }
      return transactionTypeFilter.includes(t.transaction_type);
    });
    filteredTransactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0;
      }
      categoryTotals[categoryId] += transaction.amount;
    });
    return Object.entries(categoryTotals).map(([categoryId, amount]) => ({
      categoryId,
      category: getCategoryDisplay(categoryId),
      amount
    })).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [transactions, transactionTypeFilter, getCategoryDisplay]);
  const getTopCategoriesTitle = () => {
    if (transactionTypeFilter.length === 1) {
      if (transactionTypeFilter.includes('income')) {
        return 'Top Income Categories';
      } else if (transactionTypeFilter.includes('expense')) {
        return 'Top Expense Categories';
      }
    }
    return 'Top Categories';
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Inflow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Total Outflow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Net Cash Flow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getTopCategoriesTitle()}</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCategories.slice(0, 3).map((category, index) => (
              <div key={category.categoryId} className="flex justify-between items-center text-sm">
                <span className="truncate">{category.category}</span>
                <span className="font-medium">
                  ${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};