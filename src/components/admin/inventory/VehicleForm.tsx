
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJobsites } from '@/hooks/useJobsites';
import { useToast } from '@/hooks/use-toast';
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
    jobsite_id: '',
    status: 'active',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { data: jobsites = [] } = useJobsites();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement vehicle creation API call
      console.log('Vehicle form data:', formData);
      
      toast({
        title: "Success",
        description: "Vehicle added successfully",
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
        jobsite_id: '',
        status: 'active',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to add vehicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              disabled={loading}
            >
              {loading ? (
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
