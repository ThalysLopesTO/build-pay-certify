
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useJobsites } from '@/hooks/useJobsites';
import { useToast } from '@/hooks/use-toast';
import { Plus, Car, Truck } from 'lucide-react';

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vehicle_name">Vehicle Name/ID</Label>
                <Input
                  id="vehicle_name"
                  placeholder="e.g., Company Truck #1"
                  value={formData.vehicle_name}
                  onChange={(e) => handleInputChange('vehicle_name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Select value={formData.vehicle_type} onValueChange={(value) => handleInputChange('vehicle_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup_truck">Pickup Truck</SelectItem>
                    <SelectItem value="cargo_van">Cargo Van</SelectItem>
                    <SelectItem value="box_truck">Box Truck</SelectItem>
                    <SelectItem value="flatbed">Flatbed Truck</SelectItem>
                    <SelectItem value="dump_truck">Dump Truck</SelectItem>
                    <SelectItem value="crane_truck">Crane Truck</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  placeholder="e.g., Ford, Chevrolet, Isuzu"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., F-150, Silverado, NPR"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g., 2023"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  placeholder="e.g., ABC-1234"
                  value={formData.license_plate}
                  onChange={(e) => handleInputChange('license_plate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN Number</Label>
                <Input
                  id="vin"
                  placeholder="17-character VIN"
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  maxLength={17}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobsite_id">Assigned Jobsite</Label>
                <Select value={formData.jobsite_id} onValueChange={(value) => handleInputChange('jobsite_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select jobsite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {jobsites.map((jobsite) => (
                      <SelectItem key={jobsite.id} value={jobsite.id}>
                        {jobsite.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">In Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the vehicle..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

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

      {/* Vehicle List Placeholder */}
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
    </div>
  );
};

export default VehicleForm;
