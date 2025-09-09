import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { TransactionTypeFilter } from '@/hooks/useTransactionFilters';

interface BottomSummaryCardsProps {
  transactions: TransactionWithHierarchy[];
  transactionTypeFilter: TransactionTypeFilter;
  getCategoryDisplay: (categoryId: string) => string;
}

export const BottomSummaryCards: React.FC<BottomSummaryCardsProps> = ({
  transactions,
  transactionTypeFilter,
  getCategoryDisplay,
}) => {
  // Calculate totals based on current filters
  const totalInflow = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const paidAmount = transactions
    .filter(t => t.payment_status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const unpaidAmount = transactions
    .filter(t => t.payment_status === 'unpaid')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get top 3 categories based on current filter
  const top3Categories = React.useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    const filteredTransactions = transactions.filter(t => {
      if (transactionTypeFilter === 'all') {
        return true; // Show all for this summary
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
      .slice(0, 3);
  }, [transactions, transactionTypeFilter, getCategoryDisplay]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Inflow */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Total Inflow</CardTitle>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${totalInflow.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500">
            +{transactions.filter(t => t.transaction_type === 'income').length} income
          </p>
        </CardContent>
      </Card>

      {/* Paid Amount */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Paid Amount</CardTitle>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${paidAmount.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500">
            +{transactions.filter(t => t.payment_status === 'paid').length} paid
          </p>
        </CardContent>
      </Card>

      {/* Unpaid Amount */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Unpaid Amount</CardTitle>
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg">
            <TrendingDown className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${unpaidAmount.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500">
            +{transactions.filter(t => t.payment_status === 'unpaid').length} unpaid
          </p>
        </CardContent>
      </Card>

      {/* Top 3 Categories */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Top 3 Categories</CardTitle>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {top3Categories.length === 0 ? (
              <p className="text-xs text-slate-500">No data available</p>
            ) : (
              top3Categories.map((category, index) => (
                <div key={category.categoryId} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 truncate" title={category.category}>
                    {index + 1}. {category.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
                    ${(category.amount / 1000).toFixed(0)}k
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