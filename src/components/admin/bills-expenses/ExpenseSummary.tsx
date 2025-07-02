import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

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
}

interface ExpenseSummaryProps {
  expenses: BillExpense[];
}

export const ExpenseSummary = ({ expenses }: ExpenseSummaryProps) => {
  // Current month calculations
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const totalCurrentMonth = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPaid = currentMonthExpenses
    .filter(expense => expense.payment_status === 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalUnpaid = currentMonthExpenses
    .filter(expense => expense.payment_status === 'unpaid')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Top 5 categories by cost
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category_name || 'Uncategorized';
    acc[category] = (acc[category] || 0) + expense.amount;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Current Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month Total</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCurrentMonth)}</div>
          <p className="text-xs text-muted-foreground">
            {currentMonthExpenses.length} expense{currentMonthExpenses.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Total Paid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
          <TrendingDown className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((totalPaid / totalCurrentMonth) * 100) || 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Total Unpaid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unpaid This Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((totalUnpaid / totalCurrentMonth) * 100) || 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCategories.slice(0, 3).map(([category, amount], index) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {index + 1}. {category}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {formatCurrency(amount)}
                </Badge>
              </div>
            ))}
            {topCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">No expenses yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};