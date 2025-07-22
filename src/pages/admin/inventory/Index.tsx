import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InventoryManagement from '@/components/admin/inventory/EquipmentManagement';
import VehicleManagement from '@/components/admin/inventory/VehicleManagement';
import { Package, Car, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useInventory } from '@/hooks/useInventory';
import { useVehicles } from '@/hooks/useVehicles';
import { cn } from '@/lib/utils';

const InventoryIndex = () => {
  const [activeTab, setActiveTab] = useState('equipment');
  const { inventory } = useInventory();
  const { vehicles } = useVehicles();
  
  // Summary stats
  const totalEquipment = inventory.length;
  const assignedEquipment = inventory.filter(item => item.jobsite_id).length;
  const availableEquipment = totalEquipment - assignedEquipment;
  
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const inMaintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your equipment and vehicles</p>
        </div>
        <Card className="bg-muted/40 border-dashed w-full md:w-auto">
          <CardContent className="p-4 flex items-center justify-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">Total Items:</span>{' '}
                <span className="font-bold">{totalEquipment + totalVehicles}</span>
              </div>
              <div>
                <span className="font-medium">{activeTab === 'equipment' ? 'Available:' : 'Active:'}</span>{' '}
                <span className="font-bold">{activeTab === 'equipment' ? availableEquipment : activeVehicles}</span>
              </div>
              <div>
                <span className="font-medium">{activeTab === 'equipment' ? 'Assigned:' : 'In Maintenance:'}</span>{' '}
                <span className="font-bold">{activeTab === 'equipment' ? assignedEquipment : inMaintenanceVehicles}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-lg">
          <TabsTrigger 
            value="equipment" 
            className={cn(
              "flex items-center space-x-2 rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm"
            )}
          >
            <Package className="h-4 w-4" />
            <span>Equipment</span>
          </TabsTrigger>
          <TabsTrigger 
            value="vehicles" 
            className={cn(
              "flex items-center space-x-2 rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm"
            )}
          >
            <Car className="h-4 w-4" />
            <span>Vehicles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-6 animate-in fade-in-50">
          <InventoryManagement />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6 animate-in fade-in-50">
          <VehicleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryIndex;