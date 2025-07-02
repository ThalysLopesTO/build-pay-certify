import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { useMaterialTakeoffsPaginated, useMaterialTakeoffMutations } from '@/hooks/useMaterialTakeoffsEnhanced';
import { useJobsites } from '@/hooks/useJobsites';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MaterialTakeoffToolbar from './material-takeoff/MaterialTakeoffToolbar';
import MaterialTakeoffTable from './material-takeoff/MaterialTakeoffTable';
import MaterialTakeoffForm from './MaterialTakeoffForm';
import ImportDialog from './material-takeoff/ImportDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { exportToExcel, exportToPDF } from '@/utils/materialTakeoffExport';

const MaterialTakeoffManagementEnhanced = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    jobsite_id: 'all',
    status: 'all',
    category: 'all',
    page: 1,
    limit: 25,
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTakeoff, setEditingTakeoff] = useState<any>(null);

  const { data: jobsites = [] } = useJobsites();
  const { data: paginatedData, isLoading } = useMaterialTakeoffsPaginated(filters);
  const { updateTakeoff, deleteTakeoff, bulkInsert, bulkDelete } = useMaterialTakeoffMutations();

  const takeoffs = paginatedData?.data || [];
  const totalPages = paginatedData?.total_pages || 0;
  const categories = [...new Set(takeoffs.map(t => t.category).filter(Boolean))];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleEdit = (takeoff: any) => {
    setEditingTakeoff(takeoff);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this takeoff item?')) {
      deleteTakeoff(id);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedItems.length} selected items?`)) {
      bulkDelete(selectedItems);
      setSelectedItems([]);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(takeoffs, `material-takeoffs-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    exportToPDF(takeoffs, user?.companyName || 'Company', `material-takeoffs-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material Takeoff Management</h1>
          <p className="text-muted-foreground">Manage material takeoffs and track requests efficiently</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Material Takeoffs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MaterialTakeoffToolbar
            searchQuery={filters.search}
            onSearchChange={(value) => handleFilterChange('search', value)}
            selectedJobsite={filters.jobsite_id}
            onJobsiteChange={(value) => handleFilterChange('jobsite_id', value)}
            selectedStatus={filters.status}
            onStatusChange={(value) => handleFilterChange('status', value)}
            selectedCategory={filters.category}
            onCategoryChange={(value) => handleFilterChange('category', value)}
            selectedItems={selectedItems}
            onAddNew={() => setShowForm(true)}
            onImport={() => setShowImport(true)}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onBulkEdit={() => {}}
            onBulkDelete={handleBulkDelete}
            jobsites={jobsites}
            categories={categories}
            isLoading={isLoading}
          />

          <MaterialTakeoffTable
            takeoffs={takeoffs}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInlineUpdate={(id, updates) => updateTakeoff({ id, updates })}
            isLoading={isLoading}
          />

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => filters.page > 1 && handlePageChange(filters.page - 1)}
                    className={filters.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, filters.page - 2);
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === filters.page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => filters.page < totalPages && handlePageChange(filters.page + 1)}
                    className={filters.page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <MaterialTakeoffForm
          takeoff={editingTakeoff}
          onClose={() => {
            setShowForm(false);
            setEditingTakeoff(null);
          }}
        />
      )}

      {showImport && (
        <ImportDialog
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={(data) => bulkInsert(data)}
          jobsites={jobsites}
          companyId={user?.companyId || ''}
          userId={user?.id || ''}
        />
      )}
    </div>
  );
};

export default MaterialTakeoffManagementEnhanced;