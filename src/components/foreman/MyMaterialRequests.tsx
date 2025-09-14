
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Inbox, Calendar, MapPin, Package, User, AlertCircle, RefreshCw, Filter, Search, Clock, FileText } from 'lucide-react';
import { useMaterialRequests, EnrichedMaterialRequest } from '@/hooks/useMaterialRequests';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format, differenceInHours } from 'date-fns';
import { Button } from '@/components/ui/button';
import EditMaterialRequestDialog from './EditMaterialRequestDialog';
import MaterialRequestAttachmentsIndicator from './MaterialRequestAttachmentsIndicator';
import { useCountdown } from '@/hooks/useCountdown';
import MaterialRequestDetailsDrawer from './MaterialRequestDetailsDrawer';
import { useMaterialRequestById } from '@/hooks/useMaterialRequestById';

const EditWindowChip: React.FC<{ until?: string }> = ({ until }) => {
  const { totalMs, formatted } = useCountdown(until, 60000);
  if (!until || totalMs <= 0) return null;
  return (
    <Badge className="text-xs" variant="outline">Edit window: {formatted}</Badge>
  );
};

interface MyMaterialRequestsProps { initialOpenRequestId?: string }

const MyMaterialRequests: React.FC<MyMaterialRequestsProps> = ({ initialOpenRequestId }) => {
  const { user } = useAuth();
  const { data: materialRequests = [], isLoading, error, refetch } = useMaterialRequests();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (initialOpenRequestId) {
      setSelectedId(initialOpenRequestId);
      setDrawerOpen(true);
    }
  }, [initialOpenRequestId]);

  const selectedFromList = useMemo(() => materialRequests.find(r => r.id === selectedId) || null, [materialRequests, selectedId]);
  const { data: fetchedById } = useMaterialRequestById(selectedId || undefined);
  const selectedRequest = selectedFromList || fetchedById || null;

  const openDetails = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };
  
  const closeDetails = () => {
    setDrawerOpen(false);
    setSelectedId(null);
  };

  // Get unique projects from material requests
  const projects = useMemo(() => {
    const uniqueProjects = materialRequests
      .filter(request => request.jobsites && request.jobsites.name && request.jobsites.name.trim().length > 0)
      .map(request => ({
        id: request.jobsites!.id,
        name: request.jobsites!.name
      }))
      .filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      );
    
    return uniqueProjects;
  }, [materialRequests]);

  // Filter material requests by selected project and search term
  const filteredRequests = useMemo(() => {
    let filtered = materialRequests;
    
    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(request => 
        request.jobsites && request.jobsites.id === selectedProject
      );
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.material_list?.toLowerCase().includes(term) ||
        request.jobsites?.name?.toLowerCase().includes(term) ||
        request.status?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [materialRequests, selectedProject, searchTerm]);

  // Check if a request can be edited by the foreman
  const canEditRequest = (request: EnrichedMaterialRequest) => {
    // Admins/Managers can always edit
    const isPrivileged = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';
    if (isPrivileged) return true;

    // Only foremen can edit their own within 24h and only when status allows
    if (user?.role !== 'foreman') return false;
    if (request.submitted_by !== user?.id) return false;

    const status = (request.status || '').toLowerCase();
    if (status === 'delivered' || status === 'canceled') return false;

    if (typeof request.canEdit === 'boolean') return request.canEdit;

    // Fallback if hook didn't compute canEdit
    const hoursSinceCreation = differenceInHours(new Date(), new Date(request.created_at));
    return hoursSinceCreation < 24;
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'secondary' as const;
      case 'ordered':
        return 'default' as const;
      case 'delivered':
        return 'default' as const;
      case 'archived':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading material requests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Material Requests</h3>
            <p className="text-gray-600 mb-4">
              We're having trouble loading your material requests. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <Inbox className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">My Material Requests</h1>
        </div>
        <p className="text-muted-foreground">View and manage your submitted material requests</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'No matching requests' : selectedProject === 'all' ? 'No Material Requests' : 'No requests for selected project'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? `No material requests found matching "${searchTerm}". Try adjusting your search terms.`
                  : selectedProject === 'all' 
                    ? "You haven't submitted any material requests yet." 
                    : "No material requests found for the selected project."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request: EnrichedMaterialRequest) => (
            <Card 
              key={request.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-primary/20"
              onClick={() => openDetails(request.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left section */}
                  <div className="flex-1 space-y-3">
                    {/* Project and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-lg">{request.jobsites?.name || 'Unknown Project'}</h3>
                          {request.jobsites?.address && (
                            <p className="text-sm text-muted-foreground">{request.jobsites.address}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(request.status)} className="ml-2">
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Materials */}
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Materials Requested</p>
                        <p className="text-sm line-clamp-2">{request.material_list}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Delivery: </span>
                          <span>{format(new Date(request.delivery_date + 'T00:00:00'), 'MMM dd, yyyy')}</span>
                          {request.delivery_time && (
                            <span className="text-muted-foreground ml-1">
                              at {/^\d{2}:\d{2}$/.test(request.delivery_time)
                                ? format(new Date(`2000-01-01T${request.delivery_time}`), 'h:mm a')
                                : request.delivery_time
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Submitted: </span>
                          <span>{format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right section - Actions */}
                  <div className="flex items-center space-x-2 lg:flex-col lg:items-end lg:space-x-0 lg:space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <EditMaterialRequestDialog
                        request={request}
                        canEdit={canEditRequest(request)}
                      />
                      <MaterialRequestAttachmentsIndicator
                        materialRequestId={request.id}
                      />
                    </div>
                    
                    {canEditRequest(request) && (
                      <EditWindowChip until={request.editableUntil} />
                    )}
                    
                    {!canEditRequest(request) && user?.role === 'foreman' && (
                      <div className="text-xs text-muted-foreground">
                        {differenceInHours(new Date(), new Date(request.created_at)) >= 24
                          ? 'Edit period expired'
                          : 'Cannot edit'
                        }
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MaterialRequestDetailsDrawer
        request={selectedRequest as any}
        isOpen={isDrawerOpen}
        onClose={closeDetails}
      />
    </div>
  );
};

export default MyMaterialRequests;
