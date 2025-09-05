import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

import { ExpenseWithHierarchy } from '@/hooks/useHierarchicalCategories';

interface ExpenseSummaryProps {
  expenses: ExpenseWithHierarchy[];
}

export const ExpenseSummary = ({ expenses }: ExpenseSummaryProps) => {
  // Use filtered expenses directly instead of current month only
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPaid = expenses
    .filter(expense => expense.payment_status === 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalUnpaid = expenses
    .filter(expense => expense.payment_status === 'unpaid')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Top 5 categories by cost with hierarchical display
  const categoryTotals = expenses.reduce((acc, expense) => {
    // Create hierarchical category display name
    let categoryDisplay = expense.parent_category_name || 'Uncategorized';
    if (expense.subcategory_name) {
      categoryDisplay = `${expense.parent_category_name} > ${expense.subcategory_name}`;
    }
    acc[categoryDisplay] = (acc[categoryDisplay] || 0) + expense.amount;
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
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* This Month Total */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-slate-200 text-center group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
              <p className="text-sm text-slate-600 font-medium">
                {expenses.length} bill{expenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-700 mb-1">Total Filtered</h3>
            <p className="text-xs text-slate-500">Total expenses in view</p>
          </div>
        </div>

        {/* Paid This Month */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-slate-200 text-center group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-lg">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              <p className="text-sm text-green-600 font-medium">
                ↗ {Math.round((totalPaid / totalExpenses) * 100) || 0}% paid
              </p>
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-700 mb-1">Paid Amount</h3>
            <p className="text-xs text-slate-500">Successfully processed payments</p>
          </div>
        </div>

        {/* Unpaid This Month */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-slate-200 text-center group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-lg shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</p>
              <p className="text-sm text-red-600 font-medium flex items-center justify-end">
                <TrendingUp className="h-3 w-3 mr-1" />
                ⚠ {Math.round((totalUnpaid / totalExpenses) * 100) || 0}% unpaid
              </p>
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-700 mb-1">Unpaid Amount</h3>
            <p className="text-xs text-slate-500">Outstanding bills requiring attention</p>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-slate-200 text-center group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">Top 3</p>
              <p className="text-sm text-slate-600 font-medium">Categories</p>
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-700 mb-3">Top Categories</h3>
            <div className="space-y-2">
              {topCategories.slice(0, 3).map(([category, amount], index) => (
                <div key={category} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 truncate max-w-[100px]">
                    {index + 1}. {category}
                  </span>
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-2 py-0.5">
                    {formatCurrency(amount)}
                  </Badge>
                </div>
              ))}
              {topCategories.length === 0 && (
                <p className="text-xs text-slate-400 italic">No expenses yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};