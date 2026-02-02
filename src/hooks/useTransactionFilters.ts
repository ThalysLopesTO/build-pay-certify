import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRange, DateRangeType } from './useDateRangeFilter';
import { isWithinInterval, parseISO, format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateUtils';

export interface UseTransactionFiltersReturn {
  // Filter state - now using arrays for multi-select
  transactionTypeFilter: string[];
  setTransactionTypeFilter: (types: string[]) => void;
  statusFilter: string[];
  setStatusFilter: (statuses: string[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string[];
  setCategoryFilter: (categories: string[]) => void;
  payeeFilter: string[];
  setPayeeFilter: (payees: string[]) => void;
  
  // Date range integration
  dateRangeType: DateRangeType;
  setDateRangeType: (range: DateRangeType) => void;
  customStartDate: Date | null;
  setCustomStartDate: (date: Date | null) => void;
  customEndDate: Date | null;
  setCustomEndDate: (date: Date | null) => void;
  
  // Filtered data
  getFilteredTransactions: (transactions: TransactionWithHierarchy[], dateRange: DateRange) => TransactionWithHierarchy[];
  
  // URL sync
  syncToUrl: () => void;
}

export const useTransactionFilters = (): UseTransactionFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize from URL params - now supporting arrays
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string[]>(
    searchParams.get('type')?.split(',').filter(Boolean) || []
  );
  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState<string[]>(
    searchParams.get('category')?.split(',').filter(Boolean) || []
  );
  const [payeeFilter, setPayeeFilter] = useState<string[]>(
    searchParams.get('payee')?.split(',').filter(Boolean) || []
  );
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>(
    (searchParams.get('range') as DateRangeType) || 'this-month'
  );
  const [customStartDate, setCustomStartDate] = useState<Date | null>(
    searchParams.get('start') ? parseLocalDate(searchParams.get('start')!) : null
  );
  const [customEndDate, setCustomEndDate] = useState<Date | null>(
    searchParams.get('end') ? parseLocalDate(searchParams.get('end')!) : null
  );

  // Sync filters to URL
  const syncToUrl = () => {
    const params = new URLSearchParams();
    
    if (transactionTypeFilter.length > 0) params.set('type', transactionTypeFilter.join(','));
    if (statusFilter.length > 0) params.set('status', statusFilter.join(','));
    if (searchTerm) params.set('search', searchTerm);
    if (categoryFilter.length > 0) params.set('category', categoryFilter.join(','));
    if (payeeFilter.length > 0) params.set('payee', payeeFilter.join(','));
    if (dateRangeType !== 'this-month') params.set('range', dateRangeType);
    
    // Persist custom date range start/end dates
    if (dateRangeType === 'custom') {
      if (customStartDate) params.set('start', format(customStartDate, 'yyyy-MM-dd'));
      if (customEndDate) params.set('end', format(customEndDate, 'yyyy-MM-dd'));
    }
    
    setSearchParams(params);
  };

  // Auto-sync to URL when filters change
  useEffect(() => {
    const timeoutId = setTimeout(syncToUrl, 300); // Debounce URL updates
    return () => clearTimeout(timeoutId);
  }, [transactionTypeFilter, statusFilter, searchTerm, categoryFilter, payeeFilter, dateRangeType, customStartDate, customEndDate]);

  const getFilteredTransactions = useMemo(() => {
    return (transactions: TransactionWithHierarchy[], dateRange: DateRange): TransactionWithHierarchy[] => {
      return transactions.filter(transaction => {
        // Search filter
        const matchesSearch = !searchTerm || 
          transaction.expense_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.vendor_payee.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter - if empty array, show all
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(transaction.payment_status);
        
        // Transaction type filter - if empty array, show all
        const matchesType = transactionTypeFilter.length === 0 || transactionTypeFilter.includes(transaction.transaction_type);
        
        // Category filter - if empty array, show all
        const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(transaction.parent_category_name || '');
        
        // Payee filter - if empty array, show all
        const matchesPayee = payeeFilter.length === 0 || payeeFilter.includes(transaction.vendor_payee);
        
        // Date range filter
        let matchesDateRange = true;
        if (dateRange.start && dateRange.end) {
          const transactionDate = parseISO(transaction.expense_date);
          matchesDateRange = isWithinInterval(transactionDate, {
            start: dateRange.start,
            end: dateRange.end
          });
        }
        
        return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesPayee && matchesDateRange;
      });
    };
  }, [searchTerm, statusFilter, transactionTypeFilter, categoryFilter, payeeFilter]);

  return {
    transactionTypeFilter,
    setTransactionTypeFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    payeeFilter,
    setPayeeFilter,
    dateRangeType,
    setDateRangeType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    getFilteredTransactions,
    syncToUrl,
  };
};