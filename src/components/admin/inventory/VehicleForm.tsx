
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJobsites } from '@/hooks/useJobsites';
import { useVehicles } from '@/hooks/useVehicles';
import { Plus, Car } from 'lucide-react';
import VehicleFormFields from './VehicleFormFields';
import VehicleList from './VehicleList';

const VehicleForm = () => {
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
  
  const { data: jobsites = [] } = useJobsites();
  const { createVehicle, isCreating } = useVehicles();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      // Reset form
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
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Vehicle Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Add New Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <VehicleFormFields
              formData={formData}
              onInputChange={handleInputChange}
              jobsites={jobsites}
            />

            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isCreating}
            >
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding Vehicle...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Vehicle</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <VehicleList />
    </div>
  );
};

export default VehicleForm;
