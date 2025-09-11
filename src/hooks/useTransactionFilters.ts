import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRange, DateRangeType } from './useDateRangeFilter';
import { isWithinInterval, parseISO } from 'date-fns';

export type TransactionTypeFilter = 'all' | 'income' | 'expense';
export type StatusFilter = 'all' | 'paid' | 'unpaid' | 'scheduled';

export interface UseTransactionFiltersReturn {
  // Filter state
  transactionTypeFilter: TransactionTypeFilter;
  setTransactionTypeFilter: (type: TransactionTypeFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  
  // Date range integration
  dateRangeType: DateRangeType;
  setDateRangeType: (range: DateRangeType) => void;
  
  // Filtered data
  getFilteredTransactions: (transactions: TransactionWithHierarchy[], dateRange: DateRange) => TransactionWithHierarchy[];
  
  // URL sync
  syncToUrl: () => void;
}

export const useTransactionFilters = (): UseTransactionFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize from URL params - defaults: YTD + All
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>(
    (searchParams.get('type') as TransactionTypeFilter) || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>(
    (searchParams.get('range') as DateRangeType) || 'year-to-date'
  );

  // Sync filters to URL
  const syncToUrl = () => {
    const params = new URLSearchParams();
    
    if (transactionTypeFilter !== 'all') params.set('type', transactionTypeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (searchTerm) params.set('search', searchTerm);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (dateRangeType !== 'year-to-date') params.set('range', dateRangeType);
    
    setSearchParams(params);
  };

  // Auto-sync to URL when filters change
  useEffect(() => {
    const timeoutId = setTimeout(syncToUrl, 300); // Debounce URL updates
    return () => clearTimeout(timeoutId);
  }, [transactionTypeFilter, statusFilter, searchTerm, categoryFilter, dateRangeType]);

  const getFilteredTransactions = useMemo(() => {
    return (transactions: TransactionWithHierarchy[], dateRange: DateRange): TransactionWithHierarchy[] => {
      return transactions.filter(transaction => {
        // Search filter
        const matchesSearch = !searchTerm || 
          transaction.expense_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.vendor_payee.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || transaction.payment_status === statusFilter;
        
        // Transaction type filter
        const matchesType = transactionTypeFilter === 'all' || transaction.transaction_type === transactionTypeFilter;
        
        // Category filter
        const matchesCategory = categoryFilter === 'all' || transaction.parent_category_name === categoryFilter;
        
        // Date range filter
        let matchesDateRange = true;
        if (dateRange.start && dateRange.end) {
          const transactionDate = parseISO(transaction.expense_date);
          matchesDateRange = isWithinInterval(transactionDate, {
            start: dateRange.start,
            end: dateRange.end
          });
        }
        
        return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesDateRange;
      });
    };
  }, [searchTerm, statusFilter, transactionTypeFilter, categoryFilter]);

  return {
    transactionTypeFilter,
    setTransactionTypeFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    dateRangeType,
    setDateRangeType,
    getFilteredTransactions,
    syncToUrl,
  };
};