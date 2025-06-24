
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QuoteClientSectionProps {
  formData: {
    client_name: string;
    client_company: string;
    client_email: string;
    client_phone: string;
    client_address: string;
  };
  handleInputChange: (field: string, value: string) => void;
}

const QuoteClientSection: React.FC<QuoteClientSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              name="client_name"
              type="text"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="client_company">Company</Label>
            <Input
              id="client_company"
              name="client_company"
              type="text"
              value={formData.client_company}
              onChange={(e) => handleInputChange('client_company', e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="client_email">Email *</Label>
            <Input
              id="client_email"
              name="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => handleInputChange('client_email', e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="client_phone">Phone</Label>
            <Input
              id="client_phone"
              name="client_phone"
              type="tel"
              value={formData.client_phone}
              onChange={(e) => handleInputChange('client_phone', e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="client_address">Address</Label>
          <Textarea
            id="client_address"
            name="client_address"
            value={formData.client_address}
            onChange={(e) => handleInputChange('client_address', e.target.value)}
            autoComplete="off"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteClientSection;
