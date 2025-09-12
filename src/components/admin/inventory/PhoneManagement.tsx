import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useCompanyPhones, CompanyPhone, CreateCompanyPhone } from '@/hooks/useCompanyPhones';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Phone, 
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PhoneFormFields from './PhoneFormFields';

const PhoneManagement = () => {
  const { user } = useAuth();
  const { phones, isLoading, createPhone, updatePhone, deletePhone, isCreating, isUpdating, isDeleting } = useCompanyPhones();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    phone_number: '',
    extension: '',
    notes: ''
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<CompanyPhone | null>(null);
  const [deletingPhone, setDeletingPhone] = useState<CompanyPhone | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';

  const phoneCategories = [
    'Employee',
    'Foreman', 
    'Admin/Management',
    'Sales',
    'Client',
    'Supplier',
    'Vendor',
    'Emergency Contact',
    'Other'
  ];

  // Filter phones based on search and filters
  const filteredPhones = phones.filter((phone) => {
    // Search filter
    const matchesSearch = 
      phone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.phone_number.includes(searchTerm) ||
      (phone.extension && phone.extension.includes(searchTerm));
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || phone.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      phone_number: '',
      extension: '',
      notes: ''
    });
    setEditingPhone(null);
    setIsFormOpen(false);
  };

  const handleCreatePhone = async () => {
    try {
      await createPhone({
        name: formData.name,
        category: formData.category,
        phone_number: formData.phone_number,
        extension: formData.extension || undefined,
        notes: formData.notes || undefined
      });
      resetForm();
    } catch (error) {
      console.error('Error adding phone contact:', error);
    }
  };

  const handleEditPhone = (phone: CompanyPhone) => {
    setEditingPhone(phone);
    setFormData({
      name: phone.name,
      category: phone.category,
      phone_number: phone.phone_number,
      extension: phone.extension || '',
      notes: phone.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleUpdatePhone = async () => {
    if (editingPhone) {
      try {
        await updatePhone({ 
          id: editingPhone.id, 
          updates: {
            name: formData.name,
            category: formData.category,
            phone_number: formData.phone_number,
            extension: formData.extension || undefined,
            notes: formData.notes || undefined
          } 
        });
        resetForm();
      } catch (error) {
        console.error('Error updating phone contact:', error);
      }
    }
  };

  const handleDeletePhone = async () => {
    if (deletingPhone) {
      try {
        await deletePhone(deletingPhone.id);
        setDeletingPhone(null);
      } catch (error) {
        console.error('Error deleting phone contact:', error);
      }
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Employee': 'bg-blue-100 text-blue-800 border-blue-200',
      'Foreman': 'bg-orange-100 text-orange-800 border-orange-200',
      'Admin/Management': 'bg-purple-100 text-purple-800 border-purple-200',
      'Sales': 'bg-green-100 text-green-800 border-green-200',
      'Client': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Supplier': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Vendor': 'bg-pink-100 text-pink-800 border-pink-200',
      'Emergency Contact': 'bg-red-100 text-red-800 border-red-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge variant="outline" className={`${categoryColors[category] || 'bg-gray-100 text-gray-800'} border`}>
        {category}
      </Badge>
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
  };

  const formatPhoneNumber = (phone: string, extension?: string) => {
    const formatted = phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    return extension ? `${formatted} ext. ${extension}` : formatted;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search name, phone number or extension..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {phoneCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(searchTerm || categoryFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
                Clear Filters
              </Button>
            )}
            
            {isAdmin && (
              <Button onClick={() => setIsFormOpen(true)} className="ml-auto bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>

          {/* Phone Directory Table */}
          <div className="rounded-lg overflow-hidden border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPhones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      {searchTerm || categoryFilter !== 'all'
                        ? 'No phone contacts match your filters'
                        : 'No phone contacts found. Add your first contact to get started.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPhones.map((phone, index) => (
                    <TableRow key={phone.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell className="font-medium">{phone.name}</TableCell>
                      <TableCell>{getCategoryBadge(phone.category)}</TableCell>
                      <TableCell className="font-mono">
                        {formatPhoneNumber(phone.phone_number, phone.extension)}
                      </TableCell>
                      <TableCell>
                        {phone.notes ? (
                          <span className="text-sm">{phone.notes}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">--</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(phone.created_at), 'MMM dd, yyyy')}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 transition-all hover:scale-110"
                                    onClick={() => handleEditPhone(phone)}
                                    disabled={isUpdating}
                                  >
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Contact</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 transition-all hover:scale-110 text-destructive hover:text-destructive"
                                    onClick={() => setDeletingPhone(phone)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Contact</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Phone Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              {editingPhone ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
            <DialogDescription>
              {editingPhone ? 'Update the' : 'Add a new'} phone contact details below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PhoneFormFields
              formData={formData}
              onInputChange={handleInputChange}
              categories={phoneCategories}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              onClick={editingPhone ? handleUpdatePhone : handleCreatePhone}
              disabled={isCreating || isUpdating || !formData.name || !formData.category || !formData.phone_number}
              className="bg-primary hover:bg-primary/90"
            >
              {editingPhone ? 'Update Contact' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPhone} onOpenChange={() => setDeletingPhone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phone Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingPhone?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePhone}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Delete Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PhoneManagement;