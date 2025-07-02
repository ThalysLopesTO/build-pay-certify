import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Download, FileText, Upload } from 'lucide-react';
import { useMaterialTakeoffsPaginated, useMaterialTakeoffMutations } from '@/hooks/useMaterialTakeoffsEnhanced';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MaterialTakeoffTable from '../material-takeoff/MaterialTakeoffTable';
import MaterialTakeoffForm from '../MaterialTakeoffForm';
import ImportDialog from '../material-takeoff/ImportDialog';
import { exportToExcel, exportToPDF } from '@/utils/materialTakeoffExport';

interface JobsiteMaterialTakeoffProps {
  jobsiteId: string;
  jobsiteName: string;
}

const JobsiteMaterialTakeoff: React.FC<JobsiteMaterialTakeoffProps> = ({
  jobsiteId,
  jobsiteName,
}) => {
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTakeoff, setEditingTakeoff] = useState<any>(null);

  // Filter specifically for this jobsite
  const filters = {
    jobsite_id: jobsiteId,
    search: '',
    status: '',
    category: '',
    page: 1,
    limit: 100, // Show more items for single jobsite view
  };

  const { data: paginatedData, isLoading } = useMaterialTakeoffsPaginated(filters);
  const { updateTakeoff, deleteTakeoff, bulkInsert } = useMaterialTakeoffMutations();

  const takeoffs = paginatedData?.data || [];

  const handleEdit = (takeoff: any) => {
    setEditingTakeoff(takeoff);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      deleteTakeoff(id);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(takeoffs, `${jobsiteName}-materials-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    exportToPDF(takeoffs, user?.companyName || 'Company', `${jobsiteName}-materials-${new Date().toISOString().split('T')[0]}`);
  };

  // Calculate totals for this jobsite
  const totalEstimated = takeoffs.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalRequested = takeoffs.reduce((sum, item) => sum + (item.requested_qty * item.unit_price), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <div>
              <CardTitle>Material Takeoff</CardTitle>
              <p className="text-sm text-muted-foreground">
                {takeoffs.length} materials • Est: ${totalEstimated.toFixed(2)} • Req: ${totalRequested.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={takeoffs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={takeoffs.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading materials...</div>
          </div>
        ) : takeoffs.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No materials added yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding materials to this jobsite's takeoff list.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Material
            </Button>
          </div>
        ) : (
          <MaterialTakeoffTable
            takeoffs={takeoffs}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInlineUpdate={(id, updates) => updateTakeoff({ id, updates })}
            isLoading={isLoading}
          />
        )}
      </CardContent>

      {showForm && (
        <MaterialTakeoffForm
          takeoff={editingTakeoff}
          defaultJobsiteId={jobsiteId}
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
          jobsites={[{ id: jobsiteId, name: jobsiteName }]}
          companyId={user?.companyId || ''}
          userId={user?.id || ''}
        />
      )}
    </Card>
  );
};

export default JobsiteMaterialTakeoff;