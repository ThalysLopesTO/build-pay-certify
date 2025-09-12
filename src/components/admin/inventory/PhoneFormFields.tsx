import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PhoneFormFieldsProps {
  formData: {
    name: string;
    category: string;
    phone_number: string;
    extension: string;
    notes: string;
  };
  onInputChange: (field: string, value: string) => void;
  categories: string[];
  isLoadingCategories?: boolean;
}

const PhoneFormFields = ({ formData, onInputChange, categories, isLoadingCategories = false }: PhoneFormFieldsProps) => {
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length >= 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length >= 6) {
      return cleaned.replace(/(\d{3})(\d{3})/, '($1) $2-');
    } else if (cleaned.length >= 3) {
      return cleaned.replace(/(\d{3})/, '($1) ');
    }
    return cleaned;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    onInputChange('phone_number', formatted);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Contact name"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => onInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select category"} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <SelectItem value="" disabled>Loading categories...</SelectItem>
              ) : categories.length === 0 ? (
                <SelectItem value="" disabled>No categories available</SelectItem>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone_number">Phone Number *</Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(555) 123-4567"
            maxLength={14}
            required
          />
        </div>
        <div>
          <Label htmlFor="extension">Extension</Label>
          <Input
            id="extension"
            value={formData.extension}
            onChange={(e) => onInputChange('extension', e.target.value)}
            placeholder="123"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onInputChange('notes', e.target.value)}
          placeholder="Additional notes about this contact..."
          rows={3}
        />
      </div>
    </div>
  );
};

export default PhoneFormFields;