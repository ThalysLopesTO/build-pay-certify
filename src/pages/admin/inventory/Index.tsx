
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InventoryManagement from '@/components/admin/InventoryManagement';
import VehicleForm from '@/components/admin/inventory/VehicleForm';
import { Package, Car } from 'lucide-react';

const InventoryIndex = () => {
  const [activeTab, setActiveTab] = useState('equipment');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Manage your equipment and vehicles inventory</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="equipment" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center space-x-2">
            <Car className="h-4 w-4" />
            <span>Vehicles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-6">
          <InventoryManagement />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <VehicleForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryIndex;
