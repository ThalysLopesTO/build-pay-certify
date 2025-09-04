import React, { useState } from 'react';
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
import { Plus, Search, FileDown, Calendar as CalendarIcon, Edit, Trash2, Receipt, RotateCcw, Settings2, Filter, Eye, Paperclip, AlertTriangle, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BillReminderDropdown } from '@/components/notifications/BillReminderDropdown';
import { HierarchicalCategoryManager } from './bills-expenses/HierarchicalCategoryManager';
import { HierarchicalCategorySelector } from './bills-expenses/HierarchicalCategorySelector';
import { HierarchicalCategoryFilters } from './bills-expenses/HierarchicalCategoryFilters';
import { ExpenseSummary } from './bills-expenses/ExpenseSummary';
import { RecurringBillForm } from './bills-expenses/RecurringBillForm';
import { DateFilter } from './bills-expenses/DateFilter';
import { useHierarchicalCategories, ExpenseWithHierarchy } from '@/hooks/useHierarchicalCategories';
import ExpenseAnalytics from './bills-expenses/ExpenseAnalytics';
// Using ExpenseWithHierarchy from the hook instead of local interface
const BillsExpensesManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseWithHierarchy[]>([]);
  
  // Use hierarchical categories hook
  const { 
    categories, 
    fetchCategories, 
    getExpensesWithHierarchy, 
    getCategoryDisplay 
  } = useHierarchicalCategories();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithHierarchy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [filterVendor, setFilterVendor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all'); // all, recurring, one-time
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

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

  // Recurring bills state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('');
  const [recurringStartDate, setRecurringStartDate] = useState<Date | undefined>();
  const [recurringEndDate, setRecurringEndDate] = useState<Date | undefined>();
  const [isIndefinite, setIsIndefinite] = useState(false);
  React.useEffect(() => {
    if (user?.companyId) {
      fetchExpenses();
    }
  }, [user?.companyId, fetchCategories]);
  const fetchExpenses = async () => {
    try {
      const expensesWithHierarchy = await getExpensesWithHierarchy();
      setExpenses(expensesWithHierarchy);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Remove this function as we're using the hook
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseExpenseData = {
        company_id: user?.companyId,
        expense_title: formData.expense_title,
        category_id: formData.category_id || null,
        vendor_payee: formData.vendor_payee,
        expense_date: format(formData.expense_date, 'yyyy-MM-dd'),
        amount: parseFloat(formData.amount),
        payment_status: formData.payment_status,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
        created_by: user?.id
      };

      // Add recurring bill fields if applicable
      const expenseData = isRecurring ? {
        ...baseExpenseData,
        is_recurring: true,
        recurrence_frequency: recurrenceFrequency,
        start_date: recurringStartDate ? format(recurringStartDate, 'yyyy-MM-dd') : null,
        end_date: isIndefinite ? null : recurringEndDate ? format(recurringEndDate, 'yyyy-MM-dd') : null
      } : baseExpenseData;
      if (editingExpense) {
        const {
          error
        } = await supabase.from('bills_expenses').update(expenseData).eq('id', editingExpense.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Expense updated successfully"
        });
      } else {
        const {
          error
        } = await supabase.from('bills_expenses').insert(expenseData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Expense created successfully"
        });
      }
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const {
        error
      } = await supabase.from('bills_expenses').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
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
    setIsRecurring(false);
    setRecurrenceFrequency('');
    setRecurringStartDate(undefined);
    setRecurringEndDate(undefined);
    setIsIndefinite(false);
    setEditingExpense(null);
    setIsCreateDialogOpen(false);
  };
  const startEdit = (expense: ExpenseWithHierarchy) => {
    setEditingExpense(expense);
    setFormData({
      expense_title: expense.expense_title,
      category_id: expense.category_id,
      vendor_payee: expense.vendor_payee,
      expense_date: new Date(expense.expense_date),
      amount: expense.amount.toString(),
      payment_status: expense.payment_status,
      payment_method: expense.payment_method || '',
      notes: expense.notes || ''
    });
    setIsCreateDialogOpen(true);
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">✓ Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">⚠ Unpaid</Badge>;
      case 'scheduled':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">📅 Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getCategoryBadge = (category: string) => {
    const colors = ['bg-blue-50 text-blue-700 border-blue-200', 'bg-purple-50 text-purple-700 border-purple-200', 'bg-teal-50 text-teal-700 border-teal-200', 'bg-indigo-50 text-indigo-700 border-indigo-200', 'bg-pink-50 text-pink-700 border-pink-200'];
    const colorIndex = category.charCodeAt(0) % colors.length;
    return <Badge className={`${colors[colorIndex]} font-medium`}>{category}</Badge>;
  };
  const isOverdue = (expense: ExpenseWithHierarchy) => {
    return expense.payment_status === 'unpaid' && new Date(expense.expense_date) < new Date();
  };

  // Get unique vendors for filter
  const uniqueVendors = Array.from(new Set(expenses.map(expense => expense.vendor_payee))).sort();
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expense_title.toLowerCase().includes(searchTerm.toLowerCase()) || expense.vendor_payee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || expense.payment_status === filterStatus;
    
    // Hierarchical category filtering
    let matchesCategory = true;
    if (selectedParentCategories.length > 0 || selectedSubcategories.length > 0) {
      // If parent categories selected
      const matchesParent = selectedParentCategories.length === 0 || selectedParentCategories.some(parentId => {
        if (expense.category_level === 'parent') {
          return expense.category_id === parentId;
        } else {
          // For subcategories, check if their parent is selected
          const parentCategory = categories.find(cat => cat.id === expense.category_id)?.parent_category_id;
          return parentCategory === parentId;
        }
      });
      
      // If subcategories selected
      const matchesSubcategory = selectedSubcategories.length === 0 || selectedSubcategories.includes(expense.category_id);
      
      matchesCategory = matchesParent || matchesSubcategory;
    }
    
    const matchesVendor = filterVendor === 'all' || expense.vendor_payee === filterVendor;
    const matchesType = filterType === 'all' || filterType === 'recurring' && expense.is_recurring || filterType === 'one-time' && !expense.is_recurring;
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
      const expenseDate = new Date(expense.expense_date);
      if (dateFrom && expenseDate < dateFrom) matchesDateRange = false;
      if (dateTo && expenseDate > dateTo) matchesDateRange = false;
    }
    return matchesSearch && matchesStatus && matchesCategory && matchesVendor && matchesType && matchesDateRange;
  });
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading expenses...</div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Professional Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">Bills / Expenses</h1>
              <p className="text-lg text-slate-600 font-medium">
                Track, categorize, and analyze company expenses with ease.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <BillReminderDropdown />
            <HierarchicalCategoryManager categories={categories} onCategoriesChange={fetchCategories} />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 text-sm font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    {editingExpense ? '✏️ Edit Expense' : '➕ Add New Expense'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="expense_title" className="text-sm font-semibold text-slate-700">Expense Title *</Label>
                      <Input id="expense_title" value={formData.expense_title} onChange={e => setFormData({
                      ...formData,
                      expense_title: e.target.value
                    })} placeholder="Enter expense description" className="h-11 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" required />
                    </div>
                    <div className="space-y-2">
                      <HierarchicalCategorySelector
                        selectedCategoryId={formData.category_id}
                        onCategoryChange={(categoryId) => setFormData({
                          ...formData,
                          category_id: categoryId
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="vendor_payee" className="text-sm font-semibold text-slate-700">Vendor / Payee *</Label>
                      <Input id="vendor_payee" value={formData.vendor_payee} onChange={e => setFormData({
                      ...formData,
                      vendor_payee: e.target.value
                    })} placeholder="Enter vendor name" className="h-11 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense_date" className="text-sm font-semibold text-slate-700">Date of Expense *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full h-11 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50", !formData.expense_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expense_date ? format(formData.expense_date, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={formData.expense_date} onSelect={date => date && setFormData({
                          ...formData,
                          expense_date: date
                        })} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-semibold text-slate-700">Amount (CAD) *</Label>
                      <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({
                      ...formData,
                      amount: e.target.value
                    })} placeholder="0.00" className="h-11 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_status" className="text-sm font-semibold text-slate-700">Payment Status *</Label>
                      <Select value={formData.payment_status} onValueChange={(value: 'paid' | 'unpaid' | 'scheduled') => setFormData({
                      ...formData,
                      payment_status: value
                    })}>
                        <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">⚠ Unpaid</SelectItem>
                          <SelectItem value="paid">✓ Paid</SelectItem>
                          <SelectItem value="scheduled">📅 Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method" className="text-sm font-semibold text-slate-700">Payment Method</Label>
                    <Select value={formData.payment_method} onValueChange={value => setFormData({
                    ...formData,
                    payment_method: value
                  })}>
                      <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-indigo-500">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                        <SelectItem value="cash">💵 Cash</SelectItem>
                        <SelectItem value="cheque">📄 Cheque</SelectItem>
                        <SelectItem value="other">📋 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">Notes</Label>
                    <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
                    ...formData,
                    notes: e.target.value
                  })} placeholder="Add any additional notes..." rows={3} className="bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <RecurringBillForm isRecurring={isRecurring} onRecurringChange={setIsRecurring} frequency={recurrenceFrequency} onFrequencyChange={setRecurrenceFrequency} startDate={recurringStartDate} onStartDateChange={setRecurringStartDate} endDate={recurringEndDate} onEndDateChange={setRecurringEndDate} isIndefinite={isIndefinite} onIndefiniteChange={setIsIndefinite} />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                    <Button type="button" variant="outline" onClick={resetForm} className="px-6 py-2.5">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 font-semibold">
                      {editingExpense ? 'Update Expense' : 'Create Expense'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Expense Analytics */}
        <ExpenseAnalytics expenses={filteredExpenses} />

        {/* Enhanced Analytics Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* <ExpenseSummary expenses={filteredExpenses} /> */}
        </div>
        
        {/* Date Filter - Moved below cards */}
        <DateFilter dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onClear={() => {
        setDateFrom(undefined);
        setDateTo(undefined);
      }} />

        {/* Advanced Filters & Search */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="🔍 Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40 h-11 bg-white border-slate-300">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">✓ Paid</SelectItem>
                    <SelectItem value="unpaid">⚠ Unpaid</SelectItem>
                    <SelectItem value="scheduled">📅 Scheduled</SelectItem>
                  </SelectContent>
                </Select>
                
                <HierarchicalCategoryFilters
                  selectedParentIds={selectedParentCategories}
                  selectedSubcategoryIds={selectedSubcategories}
                  onParentChange={setSelectedParentCategories}
                  onSubcategoryChange={setSelectedSubcategories}
                  onClearAll={() => {
                    setSelectedParentCategories([]);
                    setSelectedSubcategories([]);
                  }}
                />
                
                <Button variant="outline" className="h-11 px-4 border-slate-300 hover:bg-slate-50">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Expense Table */}
        <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-200 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <Receipt className="mr-3 h-5 w-5 text-indigo-600" />
              Expense Management
              <Badge className="ml-3 bg-indigo-50 text-indigo-700 border-indigo-200">
                {filteredExpenses.length} expenses
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-700 py-4">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Title</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Category</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Vendor</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Attachment</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <Receipt className="h-12 w-12 text-slate-300" />
                          <p className="text-slate-500 font-medium">No expenses found</p>
                          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                        </div>
                      </TableCell>
                    </TableRow> : filteredExpenses.map(expense => <TableRow key={expense.id} className={cn("border-b border-slate-100 hover:bg-slate-50 transition-colors", isOverdue(expense) && "bg-red-50/50 hover:bg-red-50")}>
                        <TableCell className="py-4 font-medium text-slate-700">
                          <div className="flex items-center space-x-2">
                            {isOverdue(expense) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            <span>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold text-slate-900 max-w-xs truncate">
                            {expense.expense_title}
                          </div>
                          {expense.is_recurring && <Badge className="mt-1 bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              🔄 Recurring
                            </Badge>}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            {getCategoryBadge(expense.parent_category_name)}
                            {expense.subcategory_name && (
                              <div className="text-xs text-muted-foreground">
                                → {expense.subcategory_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-medium text-slate-700 max-w-xs truncate">
                          {expense.vendor_payee}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-lg text-slate-900">
                          ${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(expense.payment_status)}
                        </TableCell>
                        <TableCell className="py-4">
                          {expense.attachment_url ? <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-1" onClick={() => window.open(expense.attachment_url, '_blank')}>
                              <Paperclip className="h-4 w-4" />
                            </Button> : <span className="text-slate-400 text-sm">—</span>}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(expense)} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default BillsExpensesManagement;