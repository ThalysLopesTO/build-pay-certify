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
    return Object.entries(categoryTotals).map(([categoryId, amount]) => ({
      categoryId,
      category: getCategoryDisplay(categoryId),
      amount
    })).sort((a, b) => b.amount - a.amount).slice(0, 5);
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
  return null;
};