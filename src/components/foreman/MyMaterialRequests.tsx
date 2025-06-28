
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inbox, Calendar, MapPin, Package, User, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { useMaterialRequests, EnrichedMaterialRequest } from '@/hooks/useMaterialRequests';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const MyMaterialRequests = () => {
  const { user } = useAuth();
  const { data: materialRequests = [], isLoading, error, refetch } = useMaterialRequests();
  const [selectedProject, setSelectedProject] = useState<string>('all');

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

  // Filter material requests by selected project
  const filteredRequests = useMemo(() => {
    if (selectedProject === 'all') {
      return materialRequests;
    }
    return materialRequests.filter(request => 
      request.jobsites && request.jobsites.id === selectedProject
    );
  }, [materialRequests, selectedProject]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Inbox className="h-5 w-5" />
          <span>My Material Requests</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Project:</span>
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold mb-2">
              {selectedProject === 'all' ? 'No Material Requests' : 'No Material Requests for Selected Project'}
            </h3>
            <p className="text-slate-600">
              {selectedProject === 'all' 
                ? "You haven't submitted any material requests yet." 
                : "No material requests found for the selected project."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foreman</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Materials</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: EnrichedMaterialRequest) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email || 'Unknown'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{request.jobsites?.name || 'Unknown Project'}</div>
                          {request.jobsites?.address && (
                            <div className="text-sm text-gray-500">{request.jobsites.address}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div>{format(new Date(request.delivery_date), 'MMM dd, yyyy')}</div>
                          <div className="text-sm text-gray-500">{request.delivery_time}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={request.material_list}>
                        {request.material_list}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyMaterialRequests;
