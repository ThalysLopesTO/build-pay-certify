import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { TransactionTypeFilter } from '@/hooks/useTransactionFilters';

interface IncomeExpensesKPIsProps {
  transactions: TransactionWithHierarchy[];
  transactionTypeFilter: TransactionTypeFilter;
  getCategoryDisplay: (categoryId: string) => string;
}

export const IncomeExpensesKPIs: React.FC<IncomeExpensesKPIsProps> = ({
  transactions,
  transactionTypeFilter,
  getCategoryDisplay,
}) => {
  // Calculate KPIs
  const totalInflow = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalInflow - totalOutflow;

  // Calculate top categories based on transaction type filter
  const topCategories = React.useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    const filteredTransactions = transactions.filter(t => {
      if (transactionTypeFilter === 'all') {
        // Show expense categories by default for "All" (original behavior)
        return t.transaction_type === 'expense';
      }
      return t.transaction_type === transactionTypeFilter;
    });

    filteredTransactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0;
      }
      categoryTotals[categoryId] += transaction.amount;
    });

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({
        categoryId,
        category: getCategoryDisplay(categoryId),
        amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, transactionTypeFilter, getCategoryDisplay]);

  const getTopCategoriesTitle = () => {
    if (transactionTypeFilter === 'income') {
      return 'Top Income Categories';
    } else if (transactionTypeFilter === 'expense') {
      return 'Top Expense Categories';
    } else {
      return 'Top Expense Categories';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Inflow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            ${totalInflow.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            +{transactions.filter(t => t.transaction_type === 'income').length} transactions
          </p>
        </CardContent>
      </Card>

      {/* Total Outflow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            ${totalOutflow.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            +{transactions.filter(t => t.transaction_type === 'expense').length} transactions
          </p>
        </CardContent>
      </Card>

      {/* Net Cash Flow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          <DollarSign className={`h-4 w-4 ${netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
            {netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
          </p>
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
            {topCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data available</p>
            ) : (
              topCategories.map((category, index) => (
                <div key={category.categoryId} className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate" title={category.category}>
                    {index + 1}. {category.category}
                  </span>
                  <span className="text-xs font-bold">
                    ${category.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};