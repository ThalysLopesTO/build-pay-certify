
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface QuoteEditorClientSectionProps {
  formData: {
    client_name: string;
    client_company: string;
    client_email: string;
    client_phone: string;
    client_address: string;
  };
  handleInputChange: (field: string, value: string) => void;
}

const QuoteEditorClientSection: React.FC<QuoteEditorClientSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Client Information</CardTitle>
          <Badge variant="outline">Required</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              placeholder="John Doe"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="client_email">Email *</Label>
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => handleInputChange('client_email', e.target.value)}
              placeholder="john@example.com"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="client_company">Company</Label>
            <Input
              id="client_company"
              value={formData.client_company}
              onChange={(e) => handleInputChange('client_company', e.target.value)}
              placeholder="Company Name"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="client_phone">Phone</Label>
            <Input
              id="client_phone"
              type="tel"
              value={formData.client_phone}
              onChange={(e) => handleInputChange('client_phone', e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="off"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="client_address">Address</Label>
          <Textarea
            id="client_address"
            value={formData.client_address}
            onChange={(e) => handleInputChange('client_address', e.target.value)}
            placeholder="123 Main St, City, Province, Postal Code"
            rows={2}
            autoComplete="off"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorClientSection;
