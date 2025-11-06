import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Car, Truck } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_name: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  status: string;
  jobsite_id?: string;
  jobsites?: { name: string };
}

interface VehicleCardProps {
  vehicle: Vehicle;
  canManageInventory: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onView: (vehicle: Vehicle) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  canManageInventory,
  onEdit,
  onDelete,
  onView,
}) => {
  const getVehicleTypeIcon = (type: string) => {
    const icons: Record<string, typeof Truck> = {
      pickup_truck: Truck,
      cargo_van: Truck,
      box_truck: Truck,
      crane_truck: Truck,
      dump_truck: Truck,
      flatbed: Truck,
      trailer: Truck,
      small_car: Car,
      other: Car,
    };
    
    const Icon = icons[type] || Car;
    return <Icon className="h-5 w-5" />;
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      small_car: 'Small Car',
      pickup_truck: 'Pickup Truck',
      cargo_van: 'Cargo Van',
      box_truck: 'Box Truck',
      crane_truck: 'Crane Truck',
      dump_truck: 'Dump Truck',
      flatbed: 'Flatbed',
      trailer: 'Trailer',
      other: 'Other',
    };
    
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
      out_of_service: 'bg-red-100 text-red-800 border-red-200',
      retired: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    const config = configs[status as keyof typeof configs] || configs.retired;
    const labels = {
      active: 'Active',
      maintenance: 'Maintenance',
      out_of_service: 'Out of Service',
      retired: 'Retired',
    };
    
    const label = labels[status as keyof typeof labels] || status;
    
    return (
      <Badge variant="outline" className={`${config} border text-xs`}>
        {label}
      </Badge>
    );
  };

  const getStatusColor = () => {
    switch (vehicle.status) {
      case 'active':
        return 'border-l-4 border-l-green-500';
      case 'maintenance':
        return 'border-l-4 border-l-orange-500';
      case 'out_of_service':
        return 'border-l-4 border-l-red-500';
      case 'retired':
        return 'border-l-4 border-l-gray-500';
      default:
        return '';
    }
  };

  return (
    <Card className={`${getStatusColor()} shadow-sm hover:shadow-md transition-all`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Icon and Name */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {getVehicleTypeIcon(vehicle.vehicle_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-1">
                {vehicle.vehicle_name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicle.make} {vehicle.model} {vehicle.year && `• ${vehicle.year}`}
              </p>
            </div>
            {getStatusBadge(vehicle.status)}
          </div>

          {/* Details */}
          <div className="space-y-2">
            {/* Vehicle Type and License Plate */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {getVehicleTypeLabel(vehicle.vehicle_type)}
              </Badge>
              {vehicle.license_plate && (
                <Badge variant="outline" className="text-xs font-mono">
                  {vehicle.license_plate}
                </Badge>
              )}
            </div>

            {/* Jobsite Assignment */}
            {vehicle.jobsites && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  📍 {vehicle.jobsites.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Actions */}
          {canManageInventory && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(vehicle)}
                className="flex-1 h-8"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(vehicle)}
                className="flex-1 h-8"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(vehicle)}
                className="flex-1 h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
