
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuoteDetailsSectionProps {
  formData: {
    project_name: string;
    quote_date: string;
    expiry_date: string;
  };
  handleInputChange: (field: string, value: string) => void;
}

const QuoteDetailsSection: React.FC<QuoteDetailsSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              name="project_name"
              type="text"
              value={formData.project_name}
              onChange={(e) => handleInputChange('project_name', e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="quote_date">Quote Date</Label>
            <Input
              id="quote_date"
              name="quote_date"
              type="date"
              value={formData.quote_date}
              onChange={(e) => handleInputChange('quote_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              name="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteDetailsSection;
