import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useChangeOrders } from '@/hooks/useChangeOrders';
import { useJobsites } from '@/hooks/useJobsites';
import UnifiedChangeOrdersTable from './UnifiedChangeOrdersTable';
import ChangeOrderForm from './ChangeOrderForm';
import EnhancedChangeOrderDetails from './EnhancedChangeOrderDetails';
import { ChangeOrder } from '@/hooks/useChangeOrders';

const UnifiedChangeOrdersPage = () => {
  const { user } = useAuth();
  const { changeOrders, updateChangeOrder, deleteChangeOrder, isLoading, error } = useChangeOrders();
  const { data: jobsites = [] } = useJobsites('all');
  
  // Debug logging
  console.log('UnifiedChangeOrdersPage - User context:', { 
    userId: user?.id, 
    companyId: user?.companyId, 
    role: user?.role,
    isAuthenticated: !!user 
  });
  console.log('Change orders data:', { 
    count: changeOrders.length, 
    isLoading, 
    error: error?.message,
    orders: changeOrders 
  });
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ChangeOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ChangeOrder | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';
  const isForeman = user?.role === 'foreman';
  const canCreateOrders = isAdmin || isForeman;

  // Filter orders based on search and filters
  const filteredOrders = changeOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesJobsite = jobsiteFilter === 'all' || order.project_id === jobsiteFilter;
    
    return matchesSearch && matchesStatus && matchesJobsite;
  });

  const handleApprove = (order: ChangeOrder) => {
    updateChangeOrder({
      id: order.id,
      data: { status: 'approved' }
    });
  };

  const handleReject = (order: ChangeOrder) => {
    updateChangeOrder({
      id: order.id,
      data: { status: 'rejected' }
    });
  };

  const handleComplete = (order: ChangeOrder) => {
    updateChangeOrder({
      id: order.id,
      data: { status: 'completed' }
    });
  };

  const handleViewDetails = (order: ChangeOrder) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleEdit = (order: ChangeOrder) => {
    setEditingOrder(order);
  };

  const canEdit = (order: ChangeOrder) => {
    // Admins can edit any order, creators can edit their own pending orders
    return isAdmin || (order.created_by === user?.id && ['draft', 'submitted'].includes(order.status));
  };

  const canDelete = (order: ChangeOrder) => {
    // Admins can delete any order, creators can delete their own draft orders
    return isAdmin || (order.created_by === user?.id && order.status === 'draft');
  };

  const canApprove = (order: ChangeOrder) => {
    // Only admins can approve orders that are submitted
    return isAdmin && order.status === 'submitted';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Extras / Changes</h1>
          <p className="text-muted-foreground">
            Manage project revisions and extra work orders
          </p>
        </div>
        {canCreateOrders && (
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Change Order
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Orders Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search change orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by jobsite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobsites</SelectItem>
                    {jobsites.map((jobsite) => (
                      <SelectItem key={jobsite.id} value={jobsite.id}>
                        {jobsite.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Declined</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading change orders...
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-red-500">
              Error loading change orders: {error.message}
            </div>
          )}
          
          {!isLoading && !error && changeOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No change orders found. Create your first change order to get started.
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && (
            <UnifiedChangeOrdersTable
              orders={filteredOrders}
              jobsites={jobsites}
              onApprove={handleApprove}
              onReject={handleReject}
              onComplete={handleComplete}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={(order) => deleteChangeOrder(order.id)}
              canEdit={canEdit}
              canDelete={canDelete}
              canApprove={canApprove}
              isAdmin={isAdmin}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {(showCreateForm || editingOrder) && (
        <ChangeOrderForm
          isOpen={showCreateForm || !!editingOrder}
          onClose={() => {
            setShowCreateForm(false);
            setEditingOrder(null);
          }}
          editingOrder={editingOrder}
          type={isAdmin ? 'admin' : 'foreman_request'}
        />
      )}

      {/* Enhanced Details View */}
      {selectedOrder && (
        <EnhancedChangeOrderDetails
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          order={selectedOrder}
          jobsites={jobsites}
        />
      )}
    </div>
  );
};

export default UnifiedChangeOrdersPage;