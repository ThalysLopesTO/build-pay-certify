import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Plus, Search, Calendar as CalendarIcon, Edit, Trash2, Receipt, TrendingUp, TrendingDown, DollarSign, Settings, Search as SearchIcon, Download, CheckCircle, AlertCircle, Clock, CreditCard, Banknote, ArrowRightLeft, Printer, ChevronDown, Paperclip, Eye, RefreshCw, Camera, X, Filter } from 'lucide-react';
import ExpenseAttachmentField from './income-expenses/ExpenseAttachmentField';
import { ScanReceiptModal } from './income-expenses/ScanReceiptModal';
import { IncomeExpensesSkeleton } from './income-expenses/IncomeExpensesSkeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDateFromDB, formatDateForDB, parseLocalDate } from '@/utils/dateUtils';
import { HierarchicalCategorySelector } from './bills-expenses/HierarchicalCategorySelector';
import { HierarchicalCategoryManager } from './bills-expenses/HierarchicalCategoryManager';
import { useHierarchicalCategories, TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { DateRangeType } from '@/hooks/useDateRangeFilter';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { getCategoryColor } from '@/utils/categoryColors';
import { MonthlyCashFlowChart } from './income-expenses/MonthlyCashFlowChart';
import { CategoryBreakdownChart } from './income-expenses/CategoryBreakdownChart';
import { IncomeExpensesKPIs } from './income-expenses/IncomeExpensesKPIs';
import { MobileChartWrapper } from './charts/MobileChartWrapper';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePrintIncomeExpenses, PrintOption } from '@/hooks/usePrintIncomeExpenses';
import * as XLSX from 'xlsx';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsPWAStandalone } from '@/hooks/useIsPWAStandalone';
import { TransactionMobileList } from './income-expenses/TransactionMobileList';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useQuery, useQueryClient } from '@tanstack/react-query';


const IncomeExpensesManagement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isPWAStandalone = useIsPWAStandalone();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const { 
    categories, 
    fetchCategories, 
    getTransactionsWithHierarchy, 
    getCategoryDisplay 
  } = useHierarchicalCategories();

  // Single source of truth for all filters including date range
  const filters = useTransactionFilters();
  
  // Print functionality
  const { generatePrintContent } = usePrintIncomeExpenses();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithHierarchy | null>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isScanReceiptOpen, setIsScanReceiptOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Form state
  const [formData, setFormData] = useState<{
    expense_title: string;
    category_id: string;
    vendor_payee: string;
    expense_date: Date;
    amount: string;
    payment_status: 'paid' | 'unpaid' | 'pending';
    payment_method: string;
    notes: string;
    is_recurring: boolean;
    recurrence_frequency: string;
    start_date: Date | null;
    end_date: Date | null;
    attachmentFile: File | null;
    existingAttachmentUrl: string | null;
  }>({
    expense_title: '',
    category_id: '',
    vendor_payee: '',
    expense_date: new Date(),
    amount: '',
    payment_status: 'unpaid',
    payment_method: '',
    notes: '',
    is_recurring: false,
    recurrence_frequency: 'monthly',
    start_date: null,
    end_date: null,
    attachmentFile: null,
    existingAttachmentUrl: null
  });

  // Cached data fetch via React Query — single query, instant on revisit.
  const {
    data: transactions = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['income-expenses', user?.companyId],
    queryFn: () => getTransactionsWithHierarchy(),
    enabled: !!user?.companyId,
    staleTime: 2 * 60 * 1000,
  });

  const fetchTransactions = async () => {
    await queryClient.invalidateQueries({ queryKey: ['income-expenses', user?.companyId] });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let attachmentUrl = formData.existingAttachmentUrl;

      // Upload file to storage if present
      if (formData.attachmentFile) {
        const fileExt = formData.attachmentFile.name.split('.').pop();
        const fileName = `${user?.companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expense-attachments')
          .upload(fileName, formData.attachmentFile);
        
        if (uploadError) throw uploadError;
        
        attachmentUrl = fileName;
        
        // Delete old attachment if replacing
        if (editingTransaction?.attachment_url) {
          await supabase.storage
            .from('expense-attachments')
            .remove([editingTransaction.attachment_url]);
        }
      }

      const transactionData = {
        company_id: user?.companyId,
        expense_title: formData.expense_title,
        category_id: formData.category_id || null,
        vendor_payee: formData.vendor_payee,
        expense_date: formatDateForDB(formData.expense_date),
        amount: parseFloat(formData.amount),
        payment_status: formData.payment_status,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
        created_by: user?.id,
        transaction_type: transactionType,
        attachment_url: attachmentUrl
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('bills_expenses')
          .update(transactionData)
          .eq('id', editingTransaction.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: `${transactionType === 'income' ? 'Income' : 'Expense'} updated successfully`
        });
      } else {
        const { error } = await supabase
          .from('bills_expenses')
          .insert(transactionData);
        if (error) throw error;
        toast({
          title: "Success",
          description: `${transactionType === 'income' ? 'Income' : 'Expense'} created successfully`
        });
      }
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      // More specific error handling for payment method validation
      const errorMessage = error?.message?.includes('bills_expenses_payment_method_check') 
        ? 'Invalid payment method selected. Please choose a valid payment method.'
        : `Failed to save ${transactionType}`;
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Handle save from scan receipt modal
  const handleSaveScannedReceipt = async (
    scannedFormData: typeof formData, 
    receiptMetadata?: { raw: object; confidence: object },
    duplicateInfo?: {
      receiptHash: string | null;
      vendorDetected: string;
      dateDetected: string;
      amountDetected: number;
      categoryDetectedId: string | null;
      duplicateStatus: 'none' | 'confirmed' | 'ignored';
      duplicateOfId: string | null;
      duplicateCandidates: object[];
    },
    scannedTransactionType?: 'income' | 'expense'
  ) => {
    try {
      const transactionData: Record<string, unknown> = {
        company_id: user?.companyId,
        expense_title: scannedFormData.expense_title,
        category_id: scannedFormData.category_id || null,
        vendor_payee: scannedFormData.vendor_payee,
        expense_date: formatDateForDB(scannedFormData.expense_date),
        amount: parseFloat(scannedFormData.amount),
        payment_status: scannedFormData.payment_status,
        payment_method: scannedFormData.payment_method || null,
        notes: scannedFormData.notes || null,
        created_by: user?.id,
        transaction_type: scannedTransactionType || 'expense',
        attachment_url: scannedFormData.existingAttachmentUrl,
        extraction_status: 'completed'
      };

      // Add receipt metadata if available
      if (receiptMetadata) {
        transactionData.receipt_raw = receiptMetadata.raw;
        transactionData.receipt_confidence = receiptMetadata.confidence;
      }

      // Add duplicate detection metadata if available
      if (duplicateInfo) {
        transactionData.receipt_hash = duplicateInfo.receiptHash;
        transactionData.vendor_detected = duplicateInfo.vendorDetected || null;
        transactionData.date_detected = duplicateInfo.dateDetected || null;
        transactionData.amount_detected = duplicateInfo.amountDetected || null;
        transactionData.category_detected_id = duplicateInfo.categoryDetectedId || null;
        transactionData.duplicate_status = duplicateInfo.duplicateStatus || 'none';
        transactionData.duplicate_of_id = duplicateInfo.duplicateOfId || null;
        transactionData.duplicate_candidates = duplicateInfo.duplicateCandidates?.length > 0 
          ? duplicateInfo.duplicateCandidates 
          : null;
      }

      const { error } = await supabase
        .from('bills_expenses')
        .insert(transactionData);
      
      if (error) throw error;
      
      const typeLabel = scannedTransactionType === 'income' ? 'Income' : 'Expense';
      toast({
        title: "Success",
        description: `${typeLabel} from scanned document saved successfully`
      });
      
      fetchTransactions();
    } catch (error) {
      console.error('Error saving scanned receipt:', error);
      toast({
        title: "Error",
        description: "Failed to save expense from receipt",
        variant: "destructive"
      });
    }
  };

  const handleViewAttachment = (attachmentPath: string | null) => {
    if (!attachmentPath) return;
    
    const { data } = supabase.storage
      .from('expense-attachments')
      .getPublicUrl(attachmentPath);
    
    window.open(data.publicUrl, '_blank');
  };

  const handleDelete = async (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      // Find the transaction to get attachment info
      const transaction = transactions.find(t => t.id === transactionToDelete);
      
      // Delete attachment from storage if exists
      if (transaction?.attachment_url) {
        await supabase.storage
          .from('expense-attachments')
          .remove([transaction.attachment_url]);
      }
      
      const { error } = await supabase
        .from('bills_expenses')
        .delete()
        .eq('id', transactionToDelete);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  // Prepare form for new transaction without affecting dialog state
  const prepareNewTransaction = (type: 'income' | 'expense') => {
    setFormData({
      expense_title: '',
      category_id: '',
      vendor_payee: '',
      expense_date: new Date(),
      amount: '',
      payment_status: 'unpaid',
      payment_method: '',
      notes: '',
      is_recurring: false,
      recurrence_frequency: 'monthly',
      start_date: null,
      end_date: null,
      attachmentFile: null,
      existingAttachmentUrl: null
    });
    setEditingTransaction(null);
    setTransactionType(type);
  };

  // Reset form and close dialog (for cancel button)
  const resetForm = () => {
    setFormData({
      expense_title: '',
      category_id: '',
      vendor_payee: '',
      expense_date: new Date(),
      amount: '',
      payment_status: 'unpaid',
      payment_method: '',
      notes: '',
      is_recurring: false,
      recurrence_frequency: 'monthly',
      start_date: null,
      end_date: null,
      attachmentFile: null,
      existingAttachmentUrl: null
    });
    setEditingTransaction(null);
    setIsCreateDialogOpen(false);
  };

  const startEdit = (transaction: TransactionWithHierarchy) => {
    setFormData({
      expense_title: transaction.expense_title,
      category_id: transaction.category_id,
      vendor_payee: transaction.vendor_payee,
      expense_date: parseLocalDate(transaction.expense_date),
      amount: transaction.amount.toString(),
      payment_status: transaction.payment_status === 'scheduled' ? 'pending' : transaction.payment_status as 'paid' | 'unpaid' | 'pending',
      payment_method: transaction.payment_method || '',
      notes: transaction.notes || '',
      is_recurring: false,
      recurrence_frequency: 'monthly',
      start_date: null,
      end_date: null,
      attachmentFile: null,
      existingAttachmentUrl: transaction.attachment_url || null
    });
    setTransactionType(transaction.transaction_type);
    setEditingTransaction(transaction);
    setIsCreateDialogOpen(true);
  };

  const getStatusBadge = (status: 'paid' | 'unpaid' | 'pending' | 'scheduled') => {
    const config = {
      paid: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Paid' },
      unpaid: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Unpaid' },
      pending: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Pending' },
      scheduled: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Scheduled' }
    };
    return (
      <Badge className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${config[status].color}`}>
        {config[status].label}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <Badge className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        Income
      </Badge>
    ) : (
      <Badge className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        Expense
      </Badge>
    );
  };

  const getCategoryPillBadge = (categoryId: string) => {
    const categoryDisplay = getCategoryDisplay(categoryId);
    if (!categoryDisplay) return null;
    
    const parentCategory = categoryDisplay.split(' > ')[0];
    const color = getCategoryColor(categoryId, parentCategory);
    
    // Convert HSL to values for opacity backgrounds
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!hslMatch) return null;
    
    const [, h, s, l] = hslMatch;
    const bgColor = `hsl(${h}, ${s}%, ${l}%, 0.1)`;
    const borderColor = `hsl(${h}, ${s}%, ${l}%, 0.3)`;
    
    return (
      <Badge 
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          color: color
        }}
      >
        {categoryDisplay}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const formatted = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Math.abs(amount));
    
    if (type === 'income') {
      return <span className="text-green-600 font-semibold tabular-nums">+{formatted}</span>;
    } else {
      return <span className="text-red-600 font-semibold tabular-nums">−{formatted}</span>;
    }
  };

  // Excel export function
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredTransactions.map(transaction => ({
        'Date': transaction.expense_date,
        'Type': transaction.transaction_type === 'income' ? 'Income' : 'Expense',
        'Title': transaction.expense_title,
        'Category': getCategoryDisplay(transaction.category_id) || 'Uncategorized',
        'Vendor/Payee': transaction.vendor_payee,
        'Amount': transaction.amount,
        'Payment Status': transaction.payment_status,
        'Payment Method': transaction.payment_method || '',
        'Notes': transaction.notes || ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 10 }, // Type
        { wch: 25 }, // Title
        { wch: 20 }, // Category
        { wch: 20 }, // Vendor/Payee
        { wch: 12 }, // Amount
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Payment Method
        { wch: 30 }  // Notes
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Generate filename with current date and filter info
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filterInfo = filters.transactionTypeFilter.length === 0 ? 'All' : 
                        filters.transactionTypeFilter.includes('income') && filters.transactionTypeFilter.includes('expense') ? 'All' :
                        filters.transactionTypeFilter.includes('income') ? 'Income' : 'Expenses';
      const filename = `${filterInfo}_Transactions_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredTransactions.length} transactions to ${filename}`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export transactions",
        variant: "destructive"
      });
    }
  };

  const handlePrint = async (option: PrintOption) => {
    const appliedFilters = {
      search: filters.searchTerm,
      dateRange: `${filters.dateRangeType}`,
      types: filters.transactionTypeFilter,
      statuses: filters.statusFilter,
      categories: filters.categoryFilter,
      payees: filters.payeeFilter
    };

    await generatePrintContent({
      option,
      transactions: filteredTransactions,
      appliedFilters
    });
  };

  // Get filtered transactions - now uses internal effectiveRange from filters hook
  const filteredTransactions = filters.getFilteredTransactions(transactions);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchTerm, filters.statusFilter, filters.transactionTypeFilter, filters.categoryFilter, filters.effectiveRange]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Pagination info
  const startItem = filteredTransactions.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(endIndex, filteredTransactions.length);

  // Get all created categories for filter dropdown
  const availableCategories = React.useMemo(() => {
    const categorySet = new Set<string>();
    categories.filter(cat => cat.category_level === 'parent').forEach(category => {
      categorySet.add(category.name);
    });
    return Array.from(categorySet).sort();
  }, [categories]);

  const availablePayees = useMemo(() => {
    const payeeSet = new Set<string>();
    transactions.forEach(transaction => {
      if (transaction.vendor_payee) {
        payeeSet.add(transaction.vendor_payee);
      }
    });
    return Array.from(payeeSet).sort();
  }, [transactions]);

  // Multi-select options
  const transactionTypeOptions: MultiSelectOption[] = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' }
  ];

  const statusOptions: MultiSelectOption[] = [
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'pending', label: 'Pending' },
    { value: 'scheduled', label: 'Scheduled' }
  ];

  const categoryOptions: MultiSelectOption[] = availableCategories.map(category => ({
    value: category,
    label: category
  }));

  const payeeOptions: MultiSelectOption[] = availablePayees.map(payee => ({
    value: payee,
    label: payee
  }));

  const hasActiveFilters =
    filters.transactionTypeFilter.length > 0 ||
    filters.statusFilter.length > 0 ||
    filters.categoryFilter.length > 0 ||
    filters.payeeFilter.length > 0 ||
    !!filters.searchTerm;

  const clearAllFilters = () => {
    filters.setTransactionTypeFilter([]);
    filters.setStatusFilter([]);
    filters.setCategoryFilter([]);
    filters.setPayeeFilter([]);
    filters.setSearchTerm('');
  };

  const totalIncome = filteredTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const netAmount = totalIncome - totalExpenses;
  const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

  if (isLoading) {
    return <IncomeExpensesSkeleton isMobile={isMobile} />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen overflow-x-hidden max-w-full">
      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 rounded-2xl shadow-lg p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bills &amp; Expenses</h1>
              <p className="text-sm text-indigo-200">{transactions.length} total transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs text-white bg-white/10 border border-white/25 hover:bg-white/20 hover:text-white font-medium"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />Print<ChevronDown className="h-3 w-3 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handlePrint('charts')} className="text-sm">
                  <TrendingUp className="h-4 w-4 mr-2" />Charts &amp; KPIs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrint('table')} className="text-sm">
                  <Receipt className="h-4 w-4 mr-2" />Transaction Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrint('full')} className="text-sm">
                  <Download className="h-4 w-4 mr-2" />Full Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <HierarchicalCategoryManager
              categories={categories}
              onCategoriesChange={fetchCategories}
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs text-white bg-white/10 border border-white/25 hover:bg-white/20 hover:text-white font-medium"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />Categories
                </Button>
              }
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-9 text-xs text-white bg-white/10 border border-white/25 hover:bg-white/20 hover:text-white font-medium"
              onClick={() => setIsScanReceiptOpen(true)}
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />Scan Receipt
            </Button>
            <Button
              size="sm"
              className="h-9 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold shadow-md shadow-emerald-900/20"
              onClick={() => { prepareNewTransaction('income'); setIsCreateDialogOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Income
            </Button>
            <Button
              size="sm"
              className="h-9 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-semibold shadow-md"
              onClick={() => { prepareNewTransaction('expense'); setIsCreateDialogOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Expense
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-2xl shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/15 flex-shrink-0">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">Bills &amp; Expenses</h1>
                <p className="text-xs text-indigo-200">{transactions.length} transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-white bg-white/10 border border-white/25 hover:bg-white/20 hover:text-white"
                onClick={() => setIsScanReceiptOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <HierarchicalCategoryManager
                categories={categories}
                onCategoriesChange={fetchCategories}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-white bg-white/10 border border-white/25 hover:bg-white/20 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-10 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-md"
              onClick={() => { prepareNewTransaction('income'); setIsCreateDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" />Add Income
            </Button>
            <Button
              className="h-10 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm shadow-md"
              onClick={() => { prepareNewTransaction('expense'); setIsCreateDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" />Add Expense
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div data-print="kpis">
        <IncomeExpensesKPIs 
          transactions={filteredTransactions}
          transactionTypeFilter={filters.transactionTypeFilter}
          getCategoryDisplay={getCategoryDisplay}
        />
      </div>

      {/* Charts Section */}
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 -mb-3">Analytics</p>
      {isMobile ? (
        <MobileChartWrapper
          titles={["Cash Flow", "Category Breakdown"]}
          className="mb-4"
        >
          <MonthlyCashFlowChart 
            transactions={filteredTransactions}
            dateRangeType={filters.dateRangeType}
            onDateRangeChange={filters.setDateRangeType}
            transactionTypeFilter={filters.transactionTypeFilter}
            onTransactionTypeChange={filters.setTransactionTypeFilter}
            customRange={filters.effectiveRange}
            onCustomRangeChange={(range) => {
              filters.setCustomStartDate(range.start);
              filters.setCustomEndDate(range.end);
            }}
          />
          <CategoryBreakdownChart 
            transactions={filteredTransactions}
            dateRangeType={filters.dateRangeType}
            onDateRangeChange={filters.setDateRangeType}
            transactionTypeFilter={filters.transactionTypeFilter}
            onTransactionTypeChange={filters.setTransactionTypeFilter}
            getCategoryDisplay={getCategoryDisplay}
          />
        </MobileChartWrapper>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4" data-print="charts">
          <MonthlyCashFlowChart 
            transactions={filteredTransactions}
            dateRangeType={filters.dateRangeType}
            onDateRangeChange={filters.setDateRangeType}
            transactionTypeFilter={filters.transactionTypeFilter}
            onTransactionTypeChange={filters.setTransactionTypeFilter}
            customRange={filters.effectiveRange}
            onCustomRangeChange={(range) => {
              filters.setCustomStartDate(range.start);
              filters.setCustomEndDate(range.end);
            }}
          />
          <CategoryBreakdownChart 
            transactions={filteredTransactions}
            dateRangeType={filters.dateRangeType}
            onDateRangeChange={filters.setDateRangeType}
            transactionTypeFilter={filters.transactionTypeFilter}
            onTransactionTypeChange={filters.setTransactionTypeFilter}
            getCategoryDisplay={getCategoryDisplay}
          />
        </div>
      )}

      {/* Compact Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-3">
        {/* Row 1: Search + Date pills + Export + Clear */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search title, vendor…"
              value={filters.searchTerm}
              onChange={(e) => filters.setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Date quick pills */}
          <div className="flex gap-1 flex-wrap">
            {([
              { value: 'this-month', label: 'Month' },
              { value: 'last-month', label: 'Last Mo.' },
              { value: 'year-to-date', label: 'YTD' },
              { value: 'all-time', label: 'All' },
              { value: 'custom', label: 'Custom' },
            ] as { value: DateRangeType; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => filters.setDateRangeType(value)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filters.dateRangeType === value
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:block">
              {filteredTransactions.length} results
            </span>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportToExcel}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Export
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-slate-800" onClick={clearAllFilters}>
                <X className="h-3.5 w-3.5 mr-1" />Clear
              </Button>
            )}
          </div>
        </div>

        {/* Custom date range (shown only when 'custom' is selected) */}
        {filters.dateRangeType === 'custom' && (
          <div className="flex flex-wrap gap-2 px-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  {filters.customStartDate ? format(filters.customStartDate, 'MMM d, yyyy') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.customStartDate || undefined}
                  onSelect={(date) => filters.setCustomStartDate(date || null)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="self-center text-xs text-slate-400">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  {filters.customEndDate ? format(filters.customEndDate, 'MMM d, yyyy') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.customEndDate || undefined}
                  onSelect={(date) => filters.setCustomEndDate(date || null)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Row 2: Multi-select dropdowns */}
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[130px] flex-1 sm:flex-none">
            <MultiSelect
              options={transactionTypeOptions}
              selected={filters.transactionTypeFilter}
              onChange={filters.setTransactionTypeFilter}
              placeholder="All Types"
              className="h-9 text-sm"
            />
          </div>
          <div className="min-w-[130px] flex-1 sm:flex-none">
            <MultiSelect
              options={statusOptions}
              selected={filters.statusFilter}
              onChange={filters.setStatusFilter}
              placeholder="All Statuses"
              className="h-9 text-sm"
            />
          </div>
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <MultiSelect
              options={categoryOptions}
              selected={filters.categoryFilter}
              onChange={filters.setCategoryFilter}
              placeholder="All Categories"
              className="h-9 text-sm"
            />
          </div>
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <MultiSelect
              options={payeeOptions}
              selected={filters.payeeFilter}
              onChange={filters.setPayeeFilter}
              placeholder="All Vendors"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
            {filters.searchTerm && (
              <button
                onClick={() => filters.setSearchTerm('')}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full hover:bg-slate-200"
              >
                "{filters.searchTerm}" <X className="h-3 w-3" />
              </button>
            )}
            {filters.transactionTypeFilter.map(type => (
              <button
                key={type}
                onClick={() => filters.setTransactionTypeFilter(filters.transactionTypeFilter.filter(t => t !== type))}
                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full hover:bg-emerald-200"
              >
                {type === 'income' ? 'Income' : 'Expense'} <X className="h-3 w-3" />
              </button>
            ))}
            {filters.statusFilter.map(status => (
              <button
                key={status}
                onClick={() => filters.setStatusFilter(filters.statusFilter.filter(s => s !== status))}
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full hover:bg-amber-200"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} <X className="h-3 w-3" />
              </button>
            ))}
            {filters.categoryFilter.map(cat => (
              <button
                key={cat}
                onClick={() => filters.setCategoryFilter(filters.categoryFilter.filter(c => c !== cat))}
                className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200"
              >
                {cat} <X className="h-3 w-3" />
              </button>
            ))}
            {filters.payeeFilter.map(payee => (
              <button
                key={payee}
                onClick={() => filters.setPayeeFilter(filters.payeeFilter.filter(p => p !== payee))}
                className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full hover:bg-indigo-200"
              >
                {payee} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transactions Section - Mobile Cards or Desktop Table */}
      {isMobile ? (
        /* Mobile View - Conditionally disable PullToRefresh for PWA standalone to avoid iOS touch issues */
        isPWAStandalone ? (
          <div className="space-y-3" data-print="table">
            {/* Manual Refresh Button for PWA */}
            <Button
              variant="outline"
              onClick={fetchTransactions}
              disabled={isFetching}
              className="w-full mb-4 h-11"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
              Refresh Transactions
            </Button>

            {/* Header with transaction count */}
            <div className="flex items-center justify-between px-1 mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Transactions
              </h3>
              <Badge variant="outline" className="text-slate-600">
                {filteredTransactions.length} total
              </Badge>
            </div>
            
            {/* Mobile transaction cards */}
            <TransactionMobileList
              transactions={paginatedTransactions}
              isLoading={isLoading}
              onEdit={startEdit}
              onDelete={handleDelete}
              getCategoryDisplay={getCategoryDisplay}
            />
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 mt-6 pb-4">
                <div className="text-sm text-slate-600 font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex-1 h-11 font-medium"
                  >
                    Previous
                  </Button>
                  <div className="px-4 py-2 bg-slate-100 rounded-md text-sm font-semibold text-slate-700 min-w-[60px] text-center">
                    {currentPage}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex-1 h-11 font-medium"
                  >
                    Next
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  Showing {startItem} to {endItem} of {filteredTransactions.length}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Regular Mobile - With Pull-to-Refresh */
          <PullToRefresh
            onRefresh={async () => {
              await fetchTransactions();
            }}
            pullingContent=""
            refreshingContent={
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            }
          >
            <div className="space-y-3" data-print="table">
              {/* Header with transaction count */}
              <div className="flex items-center justify-between px-1 mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Transactions
                </h3>
                <Badge variant="outline" className="text-slate-600">
                  {filteredTransactions.length} total
                </Badge>
              </div>
              
              {/* Mobile transaction cards */}
              <TransactionMobileList
                transactions={paginatedTransactions}
                isLoading={isLoading}
                onEdit={startEdit}
                onDelete={handleDelete}
                getCategoryDisplay={getCategoryDisplay}
              />
              
              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 mt-6 pb-4">
                  <div className="text-sm text-slate-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2 w-full max-w-sm">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex-1 h-11 font-medium"
                    >
                      Previous
                    </Button>
                    <div className="px-4 py-2 bg-slate-100 rounded-md text-sm font-semibold text-slate-700 min-w-[60px] text-center">
                      {currentPage}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex-1 h-11 font-medium"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500">
                    Showing {startItem} to {endItem} of {filteredTransactions.length}
                  </div>
                </div>
              )}
            </div>
          </PullToRefresh>
        )
      ) : (
        /* Desktop View - Table */
        <Card className="bg-white shadow-sm border-slate-200" data-print="table">
          <CardHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Transactions</CardTitle>
              <span className="text-sm text-slate-500">
                {filteredTransactions.length === 0 ? '0' : `${startItem}–${endItem}`} of {filteredTransactions.length}
              </span>
            </div>
            {filteredTransactions.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-sm">
                <span className="text-slate-500">{filteredTransactions.length} transactions</span>
                <span className="text-emerald-700 font-semibold">+{fmt.format(totalIncome)} income</span>
                <span className="text-red-600 font-semibold">−{fmt.format(totalExpenses)} expenses</span>
                <span className={`font-bold ${netAmount >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  Net {netAmount >= 0 ? '+' : ''}{fmt.format(netAmount)}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-200 bg-slate-50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5">Title</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5">Category</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5">Payer/Payee</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5 text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5 text-center">File</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-3.5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Receipt className="h-12 w-12 text-slate-300" />
                          <div>
                            <p className="text-lg font-medium">No transactions match your filters</p>
                            <p className="text-sm">Try adjusting your filters or add a new transaction</p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={() => { setTransactionType('income'); resetForm(); setIsCreateDialogOpen(true); }}
                              variant="outline"
                              size="sm"
                            >
                              Add Income
                            </Button>
                            <Button
                              onClick={() => { setTransactionType('expense'); resetForm(); setIsCreateDialogOpen(true); }}
                              variant="outline"
                              size="sm"
                            >
                              Add Expense
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors duration-100">
                        <TableCell className="font-medium text-slate-700 py-3">
                          {formatDateFromDB(transaction.expense_date, 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="py-3">
                          {getTransactionTypeBadge(transaction.transaction_type)}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 max-w-48 truncate py-3">
                          {transaction.expense_title}
                        </TableCell>
                        <TableCell className="py-3">
                          {getCategoryPillBadge(transaction.category_id)}
                        </TableCell>
                        <TableCell className="text-slate-700 max-w-32 truncate py-3">
                          {transaction.vendor_payee}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          {formatAmount(transaction.amount, transaction.transaction_type)}
                        </TableCell>
                        <TableCell className="py-3">
                          {getStatusBadge(transaction.payment_status)}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          {transaction.attachment_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAttachment(transaction.attachment_url)}
                              className="h-8 px-2 hover:bg-blue-50"
                              title="View attachment"
                            >
                              <Paperclip className="h-4 w-4 text-blue-600" />
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(transaction)}
                              className="h-8 w-8 p-0 hover:bg-slate-100"
                              title="Edit transaction"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 hover:text-red-700"
                              title="Delete transaction"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                <div className="text-sm text-slate-700">
                  Showing {startItem} to {endItem} of {filteredTransactions.length} transactions
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNumber);
                            }}
                            isActive={currentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog - Single Dialog for both mobile and desktop */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            // Delay clearing editing state so Dialog can complete its closing animation
            setTimeout(() => {
              setEditingTransaction(null);
              resetForm();
            }, 200);
          }
        }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingTransaction 
                ? `Edit ${transactionType === 'income' ? 'Income' : 'Expense'}` 
                : `Add New ${transactionType === 'income' ? 'Income' : 'Expense'}`
              }
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Title and Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="expense_title" className="text-sm font-medium text-slate-700">
                      {transactionType === 'income' ? 'Income' : 'Expense'} Title *
                    </Label>
                    <Input
                      id="expense_title"
                      value={formData.expense_title}
                      onChange={(e) => setFormData({ ...formData, expense_title: e.target.value })}
                      placeholder={`Enter ${transactionType} title`}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Category *
                    </Label>
                    <HierarchicalCategorySelector
                      selectedCategoryId={formData.category_id}
                      onCategoryChange={(categoryId) => setFormData({ ...formData, category_id: categoryId })}
                      transactionType={transactionType}
                      required
                      insideModal={true}
                    />
                  </div>
                </div>

                {/* Vendor/Payee and Amount Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vendor_payee" className="text-sm font-medium text-slate-700">
                      {transactionType === 'income' ? 'Payer' : 'Vendor / Payee'} *
                    </Label>
                    <Input
                      id="vendor_payee"
                      value={formData.vendor_payee}
                      onChange={(e) => setFormData({ ...formData, vendor_payee: e.target.value })}
                      placeholder={`Enter ${transactionType === 'income' ? 'payer' : 'vendor/payee'} name`}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                      Amount (CAD) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Date and Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Date of {transactionType === 'income' ? 'Income' : 'Expense'} *
                    </Label>
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal border-slate-300",
                            !formData.expense_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expense_date ? format(formData.expense_date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0" 
                        align="start" 
                        sideOffset={4}
                      >
                        <Calendar
                          mode="single"
                          selected={formData.expense_date}
                          onSelect={(date) => date && setFormData({ ...formData, expense_date: date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_status" className="text-sm font-medium text-slate-700">
                      Payment Status
                    </Label>
                    <Select 
                      value={formData.payment_status} 
                      onValueChange={(value: 'paid' | 'unpaid' | 'pending') => setFormData({ ...formData, payment_status: value })}
                    >
                      <SelectTrigger className="h-11 border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Paid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="unpaid">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span>Unpaid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>Pending</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-sm font-medium text-slate-700">
                    Payment Method
                  </Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger className="h-11 border-slate-300">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-green-600" />
                          <span>Cash</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="credit_card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span>Credit Card</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                          <span>Bank Transfer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cheque">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-orange-600" />
                          <span>Cheque</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter any additional notes..."
                    rows={3}
                    className="border-slate-300 resize-none"
                  />
                </div>

                {/* Attachment Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Attach Receipt/Document (Optional)
                  </Label>
                  <ExpenseAttachmentField
                    value={formData.attachmentFile}
                    existingUrl={formData.existingAttachmentUrl}
                    onChange={(file) => setFormData({ ...formData, attachmentFile: file })}
                    disabled={false}
                  />
                  <p className="text-xs text-slate-500">
                    Upload a photo or PDF of your receipt/invoice for record keeping
                  </p>
                </div>

                {/* Recurring Expense Toggle */}
                {transactionType === 'expense' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="is_recurring"
                        checked={formData.is_recurring}
                        onCheckedChange={(checked) => setFormData({ 
                          ...formData, 
                          is_recurring: checked as boolean,
                          start_date: checked ? formData.expense_date : null
                        })}
                      />
                      <Label htmlFor="is_recurring" className="text-sm font-medium text-slate-700">
                        Make this a recurring expense
                      </Label>
                    </div>

                    {formData.is_recurring && (
                      <div className="pl-6 space-y-4 border-l-2 border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-600">
                              Frequency
                            </Label>
                            <Select 
                              value={formData.recurrence_frequency} 
                              onValueChange={(value) => setFormData({ ...formData, recurrence_frequency: value })}
                            >
                              <SelectTrigger className="h-10 border-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-600">
                              End Date (Optional)
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className={cn(
                                    "w-full h-10 justify-start text-left font-normal border-slate-300",
                                    !formData.end_date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.end_date ? format(formData.end_date, "PPP") : "No end date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                                <Calendar
                                  mode="single"
                                  selected={formData.end_date || undefined}
                                  onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    className="w-full sm:w-auto px-6 h-11 border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="w-full sm:w-auto px-6 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
                  >
                    {editingTransaction ? 'Update' : 'Create'} {transactionType === 'income' ? 'Income' : 'Expense'}
                  </Button>
                </div>
              </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone 
              and will permanently remove this record from your financial data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scan Receipt Modal */}
      <ScanReceiptModal
        isOpen={isScanReceiptOpen}
        onClose={() => setIsScanReceiptOpen(false)}
        onSaveExpense={handleSaveScannedReceipt}
        companyId={user?.companyId || ''}
      />
    </div>
  );
};

export default IncomeExpensesManagement;