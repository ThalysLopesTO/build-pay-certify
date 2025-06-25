
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface VehicleFormData {
  vehicle_name: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  vin: string;
  jobsite_id: string;
  status: string;
  notes: string;
}

interface VehicleFormFieldsProps {
  formData: VehicleFormData;
  onInputChange: (field: string, value: string) => void;
  jobsites: Array<{ id: string; name: string }>;
}

const VehicleFormFields: React.FC<VehicleFormFieldsProps> = ({
  formData,
  onInputChange,
  jobsites
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="vehicle_name">Vehicle Name/ID</Label>
          <Input
            id="vehicle_name"
            placeholder="e.g., Company Truck #1"
            value={formData.vehicle_name}
            onChange={(e) => onInputChange('vehicle_name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Vehicle Type</Label>
          <Select value={formData.vehicle_type} onValueChange={(value) => onInputChange('vehicle_type', value)}>
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
            onChange={(e) => onInputChange('make', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            placeholder="e.g., F-150, Silverado, NPR"
            value={formData.model}
            onChange={(e) => onInputChange('model', e.target.value)}
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
            onChange={(e) => onInputChange('year', e.target.value)}
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
            onChange={(e) => onInputChange('license_plate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vin">VIN Number</Label>
          <Input
            id="vin"
            placeholder="17-character VIN"
            value={formData.vin}
            onChange={(e) => onInputChange('vin', e.target.value)}
            maxLength={17}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobsite_id">Assigned Jobsite</Label>
          <Select value={formData.jobsite_id} onValueChange={(value) => onInputChange('jobsite_id', value)}>
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
          <Select value={formData.status} onValueChange={(value) => onInputChange('status', value)}>
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
          onChange={(e) => onInputChange('notes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

export default VehicleFormFields;
