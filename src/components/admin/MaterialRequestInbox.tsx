
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
import AccordionMaterialRequestCard from './material-requests/AccordionMaterialRequestCard';
import MaterialRequestDetailsPanel from './material-requests/MaterialRequestDetailsPanel';
import { useQueryClient } from '@tanstack/react-query';

const MaterialRequestInbox = () => {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const queryClient = useQueryClient();
  
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
  const [expandedCard, setExpandedCard] = React.useState<string | null>(null);

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
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['enhanced-material-requests'] })}
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
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['enhanced-material-requests'] })} 
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
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="container max-w-7xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Inbox className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Material Request Inbox</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {requests.length} {requests.length === 1 ? 'Request' : 'Requests'} Found
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Filters */}
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

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {requests.length === 0 ? (
          <Card className="shadow-sm border-0 bg-muted/30">
            <CardContent className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-muted p-6 rounded-full">
                  <Inbox className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No Material Requests Found</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchTerm || statusFilter !== 'all' || dateFrom || dateTo || jobsiteFilter !== 'all'
                      ? 'No requests match your current filters. Try adjusting your search criteria.' 
                      : 'No material requests have been submitted yet. Requests will appear here once foremen submit them.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <AccordionMaterialRequestCard
                key={request.id}
                request={request}
                isExpanded={expandedCard === request.id}
                onToggle={(isExpanded) => {
                  setExpandedCard(isExpanded ? request.id : null);
                }}
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={handleViewDetails}
                onExportPDF={handleExportPDF}
              />
            ))}
          </div>
        )}
      </div>

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
