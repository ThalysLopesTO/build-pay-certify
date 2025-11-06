import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import VehicleCard from './VehicleCard';
import { Card, CardContent } from '@/components/ui/card';
import { Car } from 'lucide-react';

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

interface VehicleMobileListProps {
  vehicles: Vehicle[];
  canManageInventory: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onView: (vehicle: Vehicle) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const VehicleMobileList: React.FC<VehicleMobileListProps> = ({
  vehicles,
  canManageInventory,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center">
          <Car className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <p className="text-muted-foreground">No vehicles found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or add new vehicles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <PullToRefresh onRefresh={onRefresh} pullingContent="">
      <div className="space-y-3 pb-20">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            canManageInventory={canManageInventory}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    </PullToRefresh>
  );
};

export default VehicleMobileList;
