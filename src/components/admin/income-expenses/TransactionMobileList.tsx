import React from 'react';
import { TransactionMobileCard } from './TransactionMobileCard';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

interface TransactionMobileListProps {
  transactions: TransactionWithHierarchy[];
  isLoading: boolean;
  onEdit: (transaction: TransactionWithHierarchy) => void;
  onDelete: (id: string) => void;
  getCategoryDisplay: (categoryId: string) => string;
}

const MobileCardSkeleton = () => (
  <Card className="bg-white shadow-sm border-slate-200">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </CardContent>
  </Card>
);

export const TransactionMobileList: React.FC<TransactionMobileListProps> = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  getCategoryDisplay
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-slate-100 p-6 rounded-full">
              <Receipt className="h-12 w-12 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No Transactions Found
              </h3>
              <p className="text-sm text-slate-600">
                Try adjusting your filters or add a new transaction.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <TransactionMobileCard
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
          getCategoryDisplay={getCategoryDisplay}
        />
      ))}
    </div>
  );
};
