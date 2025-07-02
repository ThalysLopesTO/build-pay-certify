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
import { Plus, Search, FileDown, Calendar as CalendarIcon, Edit, Trash2, Receipt, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CategoryManager } from './bills-expenses/CategoryManager';
import { ExpenseSummary } from './bills-expenses/ExpenseSummary';
import { RecurringBillForm } from './bills-expenses/RecurringBillForm';

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
  is_recurring?: boolean;
  recurrence_frequency?: string;
  parent_recurring_bill_id?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

const BillsExpensesManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<BillExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BillExpense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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
    notes: '',
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
      fetchCategories();
    }
  }, [user?.companyId]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('bills_expenses')
        .select(`
          *,
          expense_categories(name)
        `)
        .eq('company_id', user?.companyId)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = data?.map(expense => ({
        id: expense.id,
        expense_title: expense.expense_title,
        category_name: expense.expense_categories?.name || 'Uncategorized',
        vendor_payee: expense.vendor_payee,
        expense_date: expense.expense_date,
        amount: expense.amount,
        payment_status: expense.payment_status as 'paid' | 'unpaid' | 'scheduled',
        payment_method: expense.payment_method,
        notes: expense.notes,
        attachment_url: expense.attachment_url,
        is_recurring: expense.is_recurring,
        recurrence_frequency: expense.recurrence_frequency,
        parent_recurring_bill_id: expense.parent_recurring_bill_id,
      })) || [];

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('company_id', user?.companyId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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
        created_by: user?.id,
      };

      // Add recurring bill fields if applicable
      const expenseData = isRecurring ? {
        ...baseExpenseData,
        is_recurring: true,
        recurrence_frequency: recurrenceFrequency,
        start_date: recurringStartDate ? format(recurringStartDate, 'yyyy-MM-dd') : null,
        end_date: isIndefinite ? null : (recurringEndDate ? format(recurringEndDate, 'yyyy-MM-dd') : null),
      } : baseExpenseData;

      if (editingExpense) {
        const { error } = await supabase
          .from('bills_expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('bills_expenses')
          .insert(expenseData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
      }

      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('bills_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
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
      notes: '',
    });
    setIsRecurring(false);
    setRecurrenceFrequency('');
    setRecurringStartDate(undefined);
    setRecurringEndDate(undefined);
    setIsIndefinite(false);
    setEditingExpense(null);
    setIsCreateDialogOpen(false);
  };

  const startEdit = (expense: BillExpense) => {
    setEditingExpense(expense);
    setFormData({
      expense_title: expense.expense_title,
      category_id: categories.find(c => c.name === expense.category_name)?.id || '',
      vendor_payee: expense.vendor_payee,
      expense_date: new Date(expense.expense_date),
      amount: expense.amount.toString(),
      payment_status: expense.payment_status,
      payment_method: expense.payment_method || '',
      notes: expense.notes || '',
    });
    setIsCreateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get unique vendors for filter
  const uniqueVendors = Array.from(new Set(expenses.map(expense => expense.vendor_payee))).sort();

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expense_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor_payee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || expense.payment_status === filterStatus;
    const matchesCategory = filterCategory === 'all' || expense.category_name === filterCategory;
    const matchesVendor = filterVendor === 'all' || expense.vendor_payee === filterVendor;
    const matchesType = filterType === 'all' || 
                       (filterType === 'recurring' && expense.is_recurring) ||
                       (filterType === 'one-time' && !expense.is_recurring);
    
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
      const expenseDate = new Date(expense.expense_date);
      if (dateFrom && expenseDate < dateFrom) matchesDateRange = false;
      if (dateTo && expenseDate > dateTo) matchesDateRange = false;
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesVendor && matchesType && matchesDateRange;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Receipt className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bills / Expenses</h1>
            <p className="text-slate-600">Track company expenses and bills</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <CategoryManager categories={categories} onCategoriesChange={fetchCategories} />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expense_title">Expense Title *</Label>
                  <Input
                    id="expense_title"
                    value={formData.expense_title}
                    onChange={(e) => setFormData({ ...formData, expense_title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor_payee">Vendor / Payee *</Label>
                  <Input
                    id="vendor_payee"
                    value={formData.vendor_payee}
                    onChange={(e) => setFormData({ ...formData, vendor_payee: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expense_date">Date of Expense *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !formData.expense_date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expense_date ? format(formData.expense_date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (CAD) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_status">Payment Status *</Label>
                  <Select value={formData.payment_status} onValueChange={(value: 'paid' | 'unpaid' | 'scheduled') => setFormData({ ...formData, payment_status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <RecurringBillForm
                isRecurring={isRecurring}
                onRecurringChange={setIsRecurring}
                frequency={recurrenceFrequency}
                onFrequencyChange={setRecurrenceFrequency}
                startDate={recurringStartDate}
                onStartDateChange={setRecurringStartDate}
                endDate={recurringEndDate}
                onEndDateChange={setRecurringEndDate}
                isIndefinite={isIndefinite}
                onIndefiniteChange={setIsIndefinite}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingExpense ? 'Update' : 'Create'} Expense
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ExpenseSummary expenses={expenses} />

      <Card>
        <CardHeader>
          <CardTitle>Expense Management</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{expense.expense_title}</TableCell>
                    <TableCell>{expense.category_name}</TableCell>
                    <TableCell>{expense.vendor_payee}</TableCell>
                    <TableCell>${expense.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(expense.payment_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillsExpensesManagement;