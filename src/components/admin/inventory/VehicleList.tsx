
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Car } from 'lucide-react';

const VehicleList: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Vehicle Inventory
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No vehicles found</p>
          <p className="text-sm">Add your first vehicle using the form above</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleList;
