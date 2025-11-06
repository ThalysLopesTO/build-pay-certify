import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { useVehicles, Vehicle, CreateVehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Car, 
  MapPin, 
  Tag,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VehicleFormFields from './VehicleFormFields';
import VehicleMobileStats from './mobile/VehicleMobileStats';
import VehicleMobileFilters from './mobile/VehicleMobileFilters';
import VehicleMobileList from './mobile/VehicleMobileList';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VehicleManagement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle, isCreating, isUpdating, isDeleting } = useVehicles();
  const { data: jobsites = [] } = useActiveJobsites();
  
  const [formData, setFormData] = useState({
    vehicle_name: '',
    vehicle_type: '',
    make: '',
    model: '',
    year: '',
    license_plate: '',
    vin: '',
    jobsite_id: 'unassigned',
    status: 'active',
    notes: ''
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  const canManageInventory = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management' || user?.role === 'foreman';

  // Calculate stats
  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === 'active').length;
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const unassigned = vehicles.filter(v => !v.jobsite_id || v.jobsite_id === 'unassigned').length;
    return { total, active, maintenance, unassigned };
  }, [vehicles]);

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    // Search filter
    const matchesSearch = 
      vehicle.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type filter
    const matchesType = typeFilter === 'all' || vehicle.vehicle_type === typeFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    // Jobsite filter
    const matchesJobsite = jobsiteFilter === 'all' || 
      (jobsiteFilter === 'unassigned' && !vehicle.jobsite_id) || 
      vehicle.jobsite_id === jobsiteFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesJobsite;
  }), [vehicles, searchTerm, typeFilter, statusFilter, jobsiteFilter]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      vehicle_name: '',
      vehicle_type: '',
      make: '',
      model: '',
      year: '',
      license_plate: '',
      vin: '',
      jobsite_id: 'unassigned',
      status: 'active',
      notes: ''
    });
    setEditingVehicle(null);
    setIsFormOpen(false);
  };

  const handleCreateVehicle = async () => {
    try {
      await createVehicle({
        vehicle_name: formData.vehicle_name,
        vehicle_type: formData.vehicle_type,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        license_plate: formData.license_plate,
        vin: formData.vin,
        jobsite_id: formData.jobsite_id === 'unassigned' ? null : formData.jobsite_id,
        status: formData.status,
        notes: formData.notes
      });
      resetForm();
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_name: vehicle.vehicle_name,
      vehicle_type: vehicle.vehicle_type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year || '',
      license_plate: vehicle.license_plate || '',
      vin: vehicle.vin || '',
      jobsite_id: vehicle.jobsite_id || 'unassigned',
      status: vehicle.status,
      notes: vehicle.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleUpdateVehicle = async () => {
    if (editingVehicle) {
      try {
        await updateVehicle({ 
          id: editingVehicle.id, 
          updates: {
            vehicle_name: formData.vehicle_name,
            vehicle_type: formData.vehicle_type,
            make: formData.make,
            model: formData.model,
            year: formData.year,
            license_plate: formData.license_plate,
            vin: formData.vin,
            jobsite_id: formData.jobsite_id === 'unassigned' ? null : formData.jobsite_id,
            status: formData.status,
            notes: formData.notes
          } 
        });
        resetForm();
      } catch (error) {
        console.error('Error updating vehicle:', error);
      }
    }
  };

  const handleDeleteVehicle = async () => {
    if (deletingVehicle) {
      try {
        await deleteVehicle(deletingVehicle.id);
        setDeletingVehicle(null);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  const getVehicleTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      small_car: 'Small Car',
      pickup_truck: 'Pickup Truck',
      cargo_van: 'Cargo Van',
      box_truck: 'Box Truck',
      crane_truck: 'Crane Truck',
      dump_truck: 'Dump Truck',
      flatbed: 'Flatbed Truck',
      trailer: 'Trailer',
      other: 'Other'
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      out_of_service: 'bg-red-100 text-red-800 border-red-200',
      retired: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const statusLabel = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <Badge variant="outline" className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} border`}>
        {statusLabel}
      </Badge>
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setJobsiteFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleRefresh = async () => {
    // Vehicles will refresh automatically via react-query
    return Promise.resolve();
  };

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile View */}
      {isMobile && (
        <>
          <VehicleMobileStats
            total={stats.total}
            active={stats.active}
            maintenance={stats.maintenance}
            unassigned={stats.unassigned}
          />
          
          <VehicleMobileFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            jobsiteFilter={jobsiteFilter}
            onJobsiteChange={setJobsiteFilter}
            jobsites={jobsites}
            onClearFilters={resetFilters}
          />
          
          <VehicleMobileList
            vehicles={filteredVehicles}
            canManageInventory={canManageInventory}
            onEdit={handleEditVehicle}
            onDelete={(vehicle: any) => setDeletingVehicle(vehicle)}
            onView={(vehicle: any) => setViewingVehicle(vehicle)}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />

          {/* Floating Action Button */}
          {canManageInventory && (
            <Button
              onClick={() => setIsFormOpen(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </>
      )}

      {/* Desktop View */}
      {!isMobile && (
        <>
        <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search vehicle, make, model or plate #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="small_car">Small Car</SelectItem>
                  <SelectItem value="pickup_truck">Pickup Truck</SelectItem>
                  <SelectItem value="cargo_van">Cargo Van</SelectItem>
                  <SelectItem value="box_truck">Box Truck</SelectItem>
                  <SelectItem value="crane_truck">Crane Truck</SelectItem>
                  <SelectItem value="dump_truck">Dump Truck</SelectItem>
                  <SelectItem value="flatbed">Flatbed Truck</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                <SelectTrigger className="w-[160px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Jobsite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobsites</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {jobsites.map((jobsite) => (
                    <SelectItem key={jobsite.id} value={jobsite.id}>
                      {jobsite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(searchTerm || jobsiteFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
                Clear Filters
              </Button>
            )}
            
            {canManageInventory && (
              <Button onClick={() => setIsFormOpen(true)} className="ml-auto bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            )}
          </div>

          {/* Vehicle Table */}
          <div className="rounded-lg overflow-hidden border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Plate #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jobsite</TableHead>
                  <TableHead>Added</TableHead>
                  {canManageInventory && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageInventory ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || jobsiteFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'No vehicles match your filters'
                        : 'No vehicles found. Add your first vehicle to get started.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle, index) => (
                    <TableRow key={vehicle.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell className="font-medium">{vehicle.vehicle_name}</TableCell>
                      <TableCell>{getVehicleTypeDisplay(vehicle.vehicle_type)}</TableCell>
                      <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell>{vehicle.license_plate || <span className="text-muted-foreground text-sm">--</span>}</TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>
                        {vehicle.jobsites?.name || (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(vehicle.created_at), 'MMM dd, yyyy')}</TableCell>
                       {canManageInventory && (
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 transition-all hover:scale-110"
                                    onClick={() => setViewingVehicle(vehicle)}
                                  >
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 transition-all hover:scale-110"
                                    onClick={() => handleEditVehicle(vehicle)}
                                    disabled={isUpdating}
                                  >
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Vehicle</p>
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
                                    onClick={() => setDeletingVehicle(vehicle)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Vehicle</p>
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

      {/* Vehicle Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle ? 'Update the' : 'Add a new'} vehicle details below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <VehicleFormFields
              formData={formData}
              onInputChange={handleInputChange}
              jobsites={jobsites}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingVehicle ? 'Updating...' : 'Adding...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {editingVehicle ? (
                    <span>Update Vehicle</span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Vehicle</span>
                    </>
                  )}
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingVehicle} onOpenChange={() => setDeletingVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingVehicle?.vehicle_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vehicle Details Sheet */}
      <Sheet open={!!viewingVehicle} onOpenChange={() => setViewingVehicle(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Vehicle Details
            </SheetTitle>
            <SheetDescription>
              Detailed information about this vehicle.
            </SheetDescription>
          </SheetHeader>
          
          {viewingVehicle && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                <div className="font-medium text-muted-foreground">Name/ID:</div>
                <div className="font-semibold">{viewingVehicle.vehicle_name}</div>
                
                <div className="font-medium text-muted-foreground">Type:</div>
                <div>{getVehicleTypeDisplay(viewingVehicle.vehicle_type)}</div>
                
                <div className="font-medium text-muted-foreground">Make:</div>
                <div>{viewingVehicle.make}</div>
                
                <div className="font-medium text-muted-foreground">Model:</div>
                <div>{viewingVehicle.model}</div>
                
                <div className="font-medium text-muted-foreground">Year:</div>
                <div>{viewingVehicle.year || 'Not specified'}</div>
                
                <div className="font-medium text-muted-foreground">License Plate:</div>
                <div>{viewingVehicle.license_plate || 'Not specified'}</div>
                
                <div className="font-medium text-muted-foreground">VIN:</div>
                <div>{viewingVehicle.vin || 'Not specified'}</div>
                
                <div className="font-medium text-muted-foreground">Status:</div>
                <div>{getStatusBadge(viewingVehicle.status)}</div>
                
                <div className="font-medium text-muted-foreground">Jobsite:</div>
                <div>{viewingVehicle.jobsites?.name || 'Unassigned'}</div>
                
                <div className="font-medium text-muted-foreground">Jobsite Address:</div>
                <div>{viewingVehicle.jobsites?.address || 'N/A'}</div>
                
                <div className="font-medium text-muted-foreground">Notes:</div>
                <div>{viewingVehicle.notes || 'No notes provided'}</div>
                
                <div className="font-medium text-muted-foreground">Added On:</div>
                <div>{format(new Date(viewingVehicle.created_at), 'MMMM dd, yyyy')}</div>
              </div>
              
              <div className="pt-4 flex justify-between">
                {canManageInventory && (
                  <Button onClick={() => {
                    setViewingVehicle(null);
                    handleEditVehicle(viewingVehicle);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Vehicle
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewingVehicle(null)}>Close</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      </>
      )}
    </div>
  );
};

export default VehicleManagement;