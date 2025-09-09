import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Plus, Search, Calendar as CalendarIcon, Edit, Trash2, Receipt, TrendingUp, TrendingDown, DollarSign, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { HierarchicalCategorySelector } from './bills-expenses/HierarchicalCategorySelector';
import { HierarchicalCategoryManager } from './bills-expenses/HierarchicalCategoryManager';
import { useHierarchicalCategories, TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { MonthlyCashFlowChart } from './income-expenses/MonthlyCashFlowChart';
import { CategoryBreakdownChart } from './income-expenses/CategoryBreakdownChart';
import { IncomeExpensesKPIs } from './income-expenses/IncomeExpensesKPIs';
import { BottomSummaryCards } from './income-expenses/BottomSummaryCards';

const IncomeExpensesManagement = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithHierarchy[]>([]);
  
  const { 
    categories, 
    fetchCategories, 
    getTransactionsWithHierarchy, 
    getCategoryDisplay 
  } = useHierarchicalCategories();

  // Date range and filter management
  const {
    selectedRange,
    setSelectedRange,
    customRange,
    setCustomRange,
    effectiveRange,
    isCustomRangeOpen,
    setIsCustomRangeOpen,
  } = useDateRangeFilter();

  const {
    transactionTypeFilter,
    setTransactionTypeFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    dateRangeType,
    setDateRangeType,
    getFilteredTransactions,
  } = useTransactionFilters();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithHierarchy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  // Form state
  const [formData, setFormData] = useState<{
    expense_title: string;
    category_id: string;
    vendor_payee: string;
    expense_date: Date;
    amount: string;
    payment_status: 'paid' | 'unpaid' | 'scheduled';
    payment_method: string;
    notes: string;
  }>({
    expense_title: '',
    category_id: '',
    vendor_payee: '',
    expense_date: new Date(),
    amount: '',
    payment_status: 'unpaid',
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      fetchTransactions();
      fetchCategories();
    }
  }, [user?.companyId]);

  const fetchTransactions = async () => {
    try {
      const allTransactions = await getTransactionsWithHierarchy();
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const transactionData = {
        company_id: user?.companyId,
        expense_title: formData.expense_title,
        category_id: formData.category_id || null,
        vendor_payee: formData.vendor_payee,
        expense_date: format(formData.expense_date, 'yyyy-MM-dd'),
        amount: parseFloat(formData.amount),
        payment_status: formData.payment_status,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
        created_by: user?.id,
        transaction_type: transactionType
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
      toast({
        title: "Error",
        description: `Failed to save ${transactionType}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bills_expenses')
        .delete()
        .eq('id', id);
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
    }
  };

  const resetForm = () => {
    setFormData({
      expense_title: '',
      category_id: '',
      vendor_payee: '',
      expense_date: new Date(),
      amount: '',
      payment_status: 'unpaid',
      payment_method: '',
      notes: ''
    });
    setEditingTransaction(null);
    setIsCreateDialogOpen(false);
  };

  const startEdit = (transaction: TransactionWithHierarchy) => {
    setFormData({
      expense_title: transaction.expense_title,
      category_id: transaction.category_id,
      vendor_payee: transaction.vendor_payee,
      expense_date: new Date(transaction.expense_date),
      amount: transaction.amount.toString(),
      payment_status: transaction.payment_status,
      payment_method: transaction.payment_method || '',
      notes: transaction.notes || ''
    });
    setTransactionType(transaction.transaction_type);
    setEditingTransaction(transaction);
    setIsCreateDialogOpen(true);
  };

  const getStatusBadge = (status: 'paid' | 'unpaid' | 'scheduled') => {
    const config = {
      paid: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' },
      unpaid: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Unpaid' },
      scheduled: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Scheduled' }
    };
    return (
      <Badge className={`${config[status].color} border`}>
        {config[status].label}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <Badge className="bg-green-100 text-green-800 border-green-200 border">
        <TrendingUp className="h-3 w-3 mr-1" />
        Income
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200 border">
        <TrendingDown className="h-3 w-3 mr-1" />
        Expense
      </Badge>
    );
  };

  // Get filtered transactions based on all active filters
  const filteredTransactions = getFilteredTransactions(transactions, effectiveRange);

  // Sync date range between components
  React.useEffect(() => {
    setDateRangeType(selectedRange);
  }, [selectedRange, setDateRangeType]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <Receipt className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">
              Income & Expenses
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Track income and expenses, analyze cash flow, and manage your company's finances.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <HierarchicalCategoryManager
            categories={categories}
            onCategoriesChange={fetchCategories}
          />
          <Button 
            onClick={() => { setTransactionType('income'); resetForm(); setIsCreateDialogOpen(true); }} 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
          <Button 
            onClick={() => { setTransactionType('expense'); resetForm(); setIsCreateDialogOpen(true); }} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <IncomeExpensesKPIs 
        transactions={filteredTransactions}
        transactionTypeFilter={transactionTypeFilter}
        getCategoryDisplay={getCategoryDisplay}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyCashFlowChart 
          transactions={filteredTransactions}
          dateRangeType={dateRangeType}
          onDateRangeChange={setSelectedRange}
          transactionTypeFilter={transactionTypeFilter}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
        <CategoryBreakdownChart 
          transactions={filteredTransactions}
          dateRangeType={dateRangeType}
          onDateRangeChange={setSelectedRange}
          transactionTypeFilter={transactionTypeFilter}
          getCategoryDisplay={getCategoryDisplay}
        />
      </div>

      {/* Bottom Summary Cards */}
      <BottomSummaryCards 
        transactions={filteredTransactions}
        transactionTypeFilter={transactionTypeFilter}
        getCategoryDisplay={getCategoryDisplay}
      />

      {/* Filters */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600">Search</Label>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Transaction Type</Label>
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payer/Payee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {transactionTypeFilter === 'income' 
                        ? "No income recorded. Click Add Income to record money received."
                        : transactionTypeFilter === 'expense'
                        ? "No expenses recorded. Click Add Expense to track spending."
                        : "No transactions found."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.expense_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getTransactionTypeBadge(transaction.transaction_type)}</TableCell>
                      <TableCell>{transaction.expense_title}</TableCell>
                      <TableCell>{getCategoryDisplay(transaction.category_id)}</TableCell>
                      <TableCell>{transaction.vendor_payee}</TableCell>
                      <TableCell>
                        <span className={transaction.transaction_type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.payment_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(transaction)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(transaction.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction 
                ? `Edit ${transactionType === 'income' ? 'Income' : 'Expense'}` 
                : `Add New ${transactionType === 'income' ? 'Income' : 'Expense'}`
              }
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense_title">
                  {transactionType === 'income' ? 'Income' : 'Expense'} Title *
                </Label>
                <Input
                  id="expense_title"
                  value={formData.expense_title}
                  onChange={(e) => setFormData({ ...formData, expense_title: e.target.value })}
                  placeholder={`Enter ${transactionType} description`}
                  required
                />
              </div>
              <div className="space-y-2">
                <HierarchicalCategorySelector
                  selectedCategoryId={formData.category_id}
                  onCategoryChange={(categoryId) => setFormData({ ...formData, category_id: categoryId })}
                  transactionType={transactionType}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_payee">
                  {transactionType === 'income' ? 'Payer' : 'Payee'} *
                </Label>
                <Input
                  id="vendor_payee"
                  value={formData.vendor_payee}
                  onChange={(e) => setFormData({ ...formData, vendor_payee: e.target.value })}
                  placeholder={`Enter ${transactionType === 'income' ? 'payer' : 'payee'} name`}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.expense_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expense_date ? format(formData.expense_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expense_date}
                      onSelect={(date) => date && setFormData({ ...formData, expense_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_status">Status</Label>
                <Select value={formData.payment_status} onValueChange={(value: 'paid' | 'unpaid' | 'scheduled') => setFormData({ ...formData, payment_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTransaction ? 'Update' : 'Create'} {transactionType === 'income' ? 'Income' : 'Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomeExpensesManagement;