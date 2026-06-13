import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';

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
  const incomeTransactions = transactions.filter(t => t.transaction_type === 'income');
  const expenseTransactions = transactions.filter(t => t.transaction_type === 'expense');

  const totalInflow = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;
  const isProfit = netCashFlow >= 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);

  const topCategories = React.useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    const filtered = transactions.filter(t => {
      if (transactionTypeFilter.length === 0) return t.transaction_type === 'expense';
      return transactionTypeFilter.includes(t.transaction_type);
    });
    filtered.forEach(t => {
      categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + t.amount;
    });
    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({ categoryId, category: getCategoryDisplay(categoryId), amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [transactions, transactionTypeFilter, getCategoryDisplay]);

  const getTopCategoriesTitle = () => {
    if (transactionTypeFilter.length === 1) {
      if (transactionTypeFilter.includes('income')) return 'Top Income Sources';
      if (transactionTypeFilter.includes('expense')) return 'Top Expense Categories';
    }
    return 'Top Categories';
  };

  const NetIcon = isProfit ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Inflow */}
      <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Inflow</p>
            <p className="text-2xl font-bold mt-2 text-emerald-600 tabular-nums">{fmt(totalInflow)}</p>
            <p className="text-xs text-slate-400 mt-1.5">
              {incomeTransactions.length} income {incomeTransactions.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Total Outflow */}
      <div className="rounded-2xl border border-slate-200 border-l-4 border-l-rose-400 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outflow</p>
            <p className="text-2xl font-bold mt-2 text-rose-600 tabular-nums">{fmt(totalOutflow)}</p>
            <p className="text-xs text-slate-400 mt-1.5">
              {expenseTransactions.length} expense {expenseTransactions.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 flex-shrink-0">
            <TrendingDown className="h-5 w-5 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Net Cash Flow */}
      <div className={`rounded-2xl border border-slate-200 border-l-4 ${isProfit ? 'border-l-emerald-400' : 'border-l-red-400'} bg-white shadow-sm hover:shadow-md transition-shadow duration-200 p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Cash Flow</p>
            <p className={`text-2xl font-bold mt-2 tabular-nums ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmt(netCashFlow)}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              {isProfit ? 'Surplus' : 'Deficit'} this period
            </p>
          </div>
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${isProfit ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <NetIcon className={`h-5 w-5 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-400 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{getTopCategoriesTitle()}</p>
          <div className="p-2.5 rounded-xl bg-indigo-50 flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
        {topCategories.length === 0 ? (
          <p className="text-xs text-slate-400">No data for this period</p>
        ) : (
          <div className="space-y-2.5">
            {topCategories.map((cat, i) => {
              const dots = ['bg-indigo-500', 'bg-purple-400', 'bg-blue-400'];
              const fmtShort = new Intl.NumberFormat('en-CA', {
                style: 'currency', currency: 'CAD', maximumFractionDigits: 0
              }).format(cat.amount);
              return (
                <div key={cat.categoryId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[i] ?? 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-600 truncate">{cat.category || 'Uncategorized'}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 tabular-nums flex-shrink-0">{fmtShort}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
