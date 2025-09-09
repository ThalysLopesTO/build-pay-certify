import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, BarChart } from 'lucide-react';

import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';

interface ExpenseSummaryProps {
  expenses: TransactionWithHierarchy[];
  transactionType?: 'income' | 'expense' | 'all';
}

export const ExpenseSummary = ({ expenses, transactionType = 'all' }: ExpenseSummaryProps) => {
  // Calculate income and expense totals
  const income = expenses.filter(t => t.transaction_type === 'income');
  const expenseTransactions = expenses.filter(t => t.transaction_type === 'expense');
  
  const totalInflow = income.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalOutflow = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  // Calculate top categories based on transaction type filter
  const transactionsForCategories = transactionType === 'all' 
    ? expenses 
    : expenses.filter(t => t.transaction_type === transactionType);
    
  const categoryTotals = transactionsForCategories.reduce((acc, transaction) => {
    const categoryName = transaction.subcategory_name 
      ? `${transaction.parent_category_name} > ${transaction.subcategory_name}`
      : transaction.parent_category_name;
    
    acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Inflow
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalInflow)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Outflow
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutflow)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Net Cash Flow
          </CardTitle>
          <DollarSign className={`h-4 w-4 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netCashFlow)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Top {transactionType === 'income' ? 'Income' : transactionType === 'expense' ? 'Expense' : ''} Categories
          </CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCategories.length > 0 ? (
              topCategories.map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="truncate">{category}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};