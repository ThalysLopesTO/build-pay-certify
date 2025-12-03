import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useChangeOrders } from '@/hooks/useChangeOrders';
import { useJobsites } from '@/hooks/useJobsites';
import { useIsMobile } from '@/hooks/use-mobile';
import ChangeOrderSummaryCards from './ChangeOrderSummaryCards';
import ChangeOrderCard from './ChangeOrderCard';
import UnifiedChangeOrdersTable from './UnifiedChangeOrdersTable';
import ChangeOrderForm from './ChangeOrderForm';
import PrintableChangeOrderModal from './PrintableChangeOrderModal';
import { ChangeOrder } from '@/hooks/useChangeOrders';

const UnifiedChangeOrdersPage = () => {
  const { user } = useAuth();
  const { changeOrders, updateChangeOrder, deleteChangeOrder, isLoading, error } = useChangeOrders();
  const { data: jobsites = [] } = useJobsites('all');
  const isMobile = useIsMobile();
  
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeTab, setActiveTab] = useState<'extras' | 'changes'>('extras');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';
  const isForeman = user?.role === 'foreman';
  const canCreateOrders = isAdmin || isForeman;
  // Everyone can view costs now

  // Filter orders based on active tab and other filters
  const filteredOrders = changeOrders.filter(order => {
    const matchesTab = activeTab === 'extras' ? order.order_type === 'extra' : order.order_type === 'change';
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesJobsite = jobsiteFilter === 'all' || order.project_id === jobsiteFilter;
    
    return matchesTab && matchesSearch && matchesStatus && matchesJobsite;
  });

  // Get orders for current tab for summary cards
  const tabOrders = changeOrders.filter(order => 
    activeTab === 'extras' ? order.order_type === 'extra' : order.order_type === 'change'
  );

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

  const getJobsiteName = (projectId: string) => {
    const jobsite = jobsites.find(j => j.id === projectId);
    return jobsite?.name || 'Unknown Jobsite';
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
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Extras / Changes</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage project revisions and extra work orders
          </p>
        </div>
        {canCreateOrders && (
          <Button onClick={() => setShowCreateForm(true)} className="gap-2 w-full md:w-auto">
            <Plus className="h-4 w-4" />
            New Change Order
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <ChangeOrderSummaryCards orders={tabOrders} />

      {/* Tabs for Extras and Changes */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'extras' | 'changes')}>
        <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
          <TabsTrigger value="extras" className="text-sm font-medium">
            Extras
          </TabsTrigger>
          <TabsTrigger value="changes" className="text-sm font-medium">
            Changes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extras" className="mt-0">
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Extras Management</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              {/* Mobile Filters */}
              <div className="flex flex-col gap-3 mb-4 md:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Jobsite" />
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
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

              {/* Desktop Filters */}
              <div className="hidden md:flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
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

                  {/* View Mode Toggle - Desktop only */}
                  <div className="flex items-center gap-1 border rounded-lg p-1 ml-4">
                    <Button
                      variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className="h-8"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="h-8"
                    >
                      <List className="h-4 w-4" />
                    </Button>
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

              {/* Content */}
              {!isLoading && !error && (
                <>
                  {(isMobile || viewMode === 'cards') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {filteredOrders.map((order) => (
                        <ChangeOrderCard
                          key={order.id}
                          order={order}
                          jobsiteName={getJobsiteName(order.project_id)}
                          onViewDetails={handleViewDetails}
                          onEdit={handleEdit}
                          onDelete={(order) => deleteChangeOrder(order.id)}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onComplete={handleComplete}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          canApprove={canApprove}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  ) : (
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="mt-0">
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Changes Management</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              {/* Mobile Filters */}
              <div className="flex flex-col gap-3 mb-4 md:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Jobsite" />
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
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

              {/* Desktop Filters */}
              <div className="hidden md:flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
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

                  {/* View Mode Toggle - Desktop only */}
                  <div className="flex items-center gap-1 border rounded-lg p-1 ml-4">
                    <Button
                      variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className="h-8"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="h-8"
                    >
                      <List className="h-4 w-4" />
                    </Button>
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

              {/* Content */}
              {!isLoading && !error && (
                <>
                  {(isMobile || viewMode === 'cards') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {filteredOrders.map((order) => (
                        <ChangeOrderCard
                          key={order.id}
                          order={order}
                          jobsiteName={getJobsiteName(order.project_id)}
                          onViewDetails={handleViewDetails}
                          onEdit={handleEdit}
                          onDelete={(order) => deleteChangeOrder(order.id)}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onComplete={handleComplete}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          canApprove={canApprove}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  ) : (
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
          defaultOrderType={activeTab === 'extras' ? 'extra' : 'change'}
        />
      )}

      {/* Printable Details Modal */}
      {selectedOrder && (
        <PrintableChangeOrderModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          order={selectedOrder}
          jobsiteName={getJobsiteName(selectedOrder.project_id)}
        />
      )}
    </div>
  );
};

export default UnifiedChangeOrdersPage;