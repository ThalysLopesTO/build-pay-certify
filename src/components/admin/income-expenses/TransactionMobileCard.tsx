import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Folder, User, Edit, Trash2 } from 'lucide-react';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { formatDateFromDB } from '@/utils/dateUtils';
import { getCategoryColor } from '@/utils/categoryColors';
import { motion, PanInfo } from 'framer-motion';

interface TransactionMobileCardProps {
  transaction: TransactionWithHierarchy;
  onEdit: (transaction: TransactionWithHierarchy) => void;
  onDelete: (id: string) => void;
  getCategoryDisplay: (categoryId: string) => string;
}

export const TransactionMobileCard: React.FC<TransactionMobileCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  getCategoryDisplay
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const DELETE_THRESHOLD = -120; // Pixels to swipe left before deleting

  const handleDragEnd = (_event: any, info: PanInfo) => {
    if (info.offset.x < DELETE_THRESHOLD) {
      setShowDeleteDialog(true);
    }
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(transaction.id);
      setShowDeleteDialog(false);
    }, 200);
  };
  const getStatusBadge = (status: 'paid' | 'unpaid' | 'pending' | 'scheduled') => {
    const config = {
      paid: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' },
      unpaid: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Unpaid' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      scheduled: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Scheduled' }
    };
    return (
      <Badge className={`text-xs font-medium border ${config[status].color}`}>
        {config[status].label}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <Badge className="text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        Income
      </Badge>
    ) : (
      <Badge className="text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        Expense
      </Badge>
    );
  };

  const getCategoryBadge = (categoryId: string) => {
    const categoryDisplay = getCategoryDisplay(categoryId);
    if (!categoryDisplay) return null;
    
    const parentCategory = categoryDisplay.split(' > ')[0];
    const color = getCategoryColor(categoryId, parentCategory);
    
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!hslMatch) return null;
    
    const [, h, s, l] = hslMatch;
    const bgColor = `hsl(${h}, ${s}%, ${l}%, 0.15)`;
    const borderColor = `hsl(${h}, ${s}%, ${l}%, 0.3)`;
    
    return (
      <span 
        className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          color: color
        }}
      >
        <Folder className="h-3 w-3 mr-1" />
        {categoryDisplay}
      </span>
    );
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const formatted = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Math.abs(amount));
    
    if (type === 'income') {
      return <span className="text-green-600 font-bold text-lg">+{formatted}</span>;
    } else {
      return <span className="text-red-600 font-bold text-lg">−{formatted}</span>;
    }
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{transaction.expense_title}</strong>? 
              This action cannot be undone and will permanently remove this{' '}
              {transaction.transaction_type === 'income' ? 'income' : 'expense'} record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative overflow-hidden rounded-lg">
      {/* Delete Background - Revealed on Swipe */}
      <div className="absolute inset-0 bg-gradient-to-l from-red-500 to-red-600 flex items-center justify-end pr-6 rounded-lg">
        <div className="flex flex-col items-center">
          <Trash2 className="h-6 w-6 text-white mb-1" />
          <span className="text-xs font-semibold text-white">Delete</span>
        </div>
      </div>

      {/* Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={isDeleting ? "opacity-0" : ""}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        whileTap={{ cursor: "grabbing" }}
      >
        <Card className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            {/* Header Row - Type Badge and Amount */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {getTransactionTypeBadge(transaction.transaction_type)}
              </div>
              <div className="text-right">
                {formatAmount(transaction.amount, transaction.transaction_type)}
              </div>
            </div>

            {/* Title and Status */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900 flex-1 pr-2">
                {transaction.expense_title}
              </h3>
              {getStatusBadge(transaction.payment_status === 'scheduled' ? 'scheduled' : transaction.payment_status as 'paid' | 'unpaid' | 'pending')}
            </div>

            {/* Details Grid */}
            <div className="space-y-2 mb-3 text-sm text-slate-600">
              {/* Date */}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                <span>{formatDateFromDB(transaction.expense_date)}</span>
              </div>

              {/* Category */}
              {transaction.category_id && (
                <div className="flex items-center">
                  {getCategoryBadge(transaction.category_id)}
                </div>
              )}

              {/* Payee/Vendor */}
              {transaction.vendor_payee && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  <span className="truncate">{transaction.vendor_payee}</span>
                </div>
              )}

              {/* Payment Method */}
              {transaction.payment_method && (
                <div className="flex items-center">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {transaction.payment_method}
                  </span>
                </div>
              )}
            </div>

            {/* Notes (if any) */}
            {transaction.notes && (
              <div className="mb-3 p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-100">
                {transaction.notes}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(transaction)}
                className="flex-1 h-10 text-sm font-medium"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 h-10 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </>
  );
};
