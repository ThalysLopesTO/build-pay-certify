
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Inbox, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useEnhancedMaterialRequestsAdmin } from '@/hooks/useEnhancedMaterialRequestsAdmin';
import { generateMaterialRequestPDF } from '@/utils/materialRequestPDFGenerator';
import { MaterialRequest } from './types/materialRequest';
import { supabase } from '@/integrations/supabase/client';
import EnhancedMaterialRequestFilters from './material-requests/EnhancedMaterialRequestFilters';
import EnhancedMaterialRequestCard from './material-requests/EnhancedMaterialRequestCard';
import MaterialRequestDetailsPanel from './material-requests/MaterialRequestDetailsPanel';

const MaterialRequestInbox = () => {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  
  const {
    requests,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    jobsiteFilter,
    setJobsiteFilter,
    selectedRequest,
    setSelectedRequest,
    handleStatusUpdate,
    clearFilters
  } = useEnhancedMaterialRequestsAdmin();

  const [detailsPanelOpen, setDetailsPanelOpen] = React.useState(false);

  const isPermissionError = (error: any) => {
    return error?.message?.includes('permission denied') || 
           error?.message?.includes('auth.users') ||
           error?.code === 'PGRST301';
  };

  const handleViewDetails = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setDetailsPanelOpen(true);
  };

  const handleExportPDF = async (request: MaterialRequest) => {
    try {
      // Fetch attachments for this request
      const { data, error } = await supabase
        .from('material_request_attachments')
        .select('*')
        .eq('material_request_id', request.id);
      
      const attachments = data || [];
      
      await generateMaterialRequestPDF({
        jobsiteName: request.jobsites?.name || 'Unknown Jobsite',
        jobsiteAddress: request.jobsites?.address,
        deliveryDate: request.delivery_date,
        deliveryTime: request.delivery_time,
        floorUnit: request.floor_unit,
        materialList: request.material_list,
        submittedBy: (request as any).submitted_by_name || 'Unknown User',
        submittedAt: request.created_at,
        attachments
      }, {
        logoUrl,
        companyName: settings?.company_name
      });
      
      toast({
        title: "PDF Generated",
        description: "Material request PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p>Loading material requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Inbox className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Material Request Inbox</h2>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isPermissionError(error) ? (
              <div className="space-y-2">
                <p className="font-semibold">Access Permission Error</p>
                <p>Unable to load material requests due to database permissions. This might be a temporary issue.</p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Page
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  If this issue persists, please contact support or try logging out and back in.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold">Error Loading Material Requests</p>
                <p>We're having trouble loading the material requests. Error: {error.message}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Inbox className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Material Request Inbox</h2>
          <Badge variant="secondary">{requests.length} requests</Badge>
        </div>
      </div>

      {/* Enhanced Filters */}
      <EnhancedMaterialRequestFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        jobsiteFilter={jobsiteFilter}
        setJobsiteFilter={setJobsiteFilter}
        onClearFilters={clearFilters}
      />

      {/* Enhanced Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Material Requests Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFrom || dateTo || jobsiteFilter !== 'all'
                ? 'No requests match your current filters.' 
                : 'No material requests have been submitted yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <EnhancedMaterialRequestCard
              key={request.id}
              request={request}
              onStatusUpdate={handleStatusUpdate}
              onViewDetails={handleViewDetails}
              onExportPDF={handleExportPDF}
            />
          ))}
        </div>
      )}

      {/* Details Panel */}
      <MaterialRequestDetailsPanel
        request={selectedRequest}
        isOpen={detailsPanelOpen}
        onClose={() => setDetailsPanelOpen(false)}
        onStatusUpdate={handleStatusUpdate}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
};

export default MaterialRequestInbox;
