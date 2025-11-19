
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Quote } from '@/hooks/quotes';

interface QuoteEditorDetailsCardProps {
  formData: {
    quote_number: string;
    quote_date: string;
    expiry_date: string;
    status: string;
    template: string;
  };
  handleInputChange: (field: string, value: string) => void;
  quote: Quote | null;
}

const QuoteEditorDetailsCard: React.FC<QuoteEditorDetailsCardProps> = ({
  formData,
  handleInputChange,
  quote,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="text-lg">Quote Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Quote Number - Editable */}
        <div>
          <Label htmlFor="quote_number" className="text-xs text-muted-foreground">
            Quote Number
          </Label>
          <Input
            id="quote_number"
            value={formData.quote_number || ''}
            onChange={(e) => handleInputChange('quote_number', e.target.value)}
            placeholder="Auto-generated"
            className="font-mono font-semibold"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave blank to auto-generate, or customize this quote number.
          </p>
        </div>

        {/* Date Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="quote_date">Quote Date</Label>
            <Input 
              id="quote_date"
              type="date" 
              value={formData.quote_date}
              onChange={(e) => handleInputChange('quote_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input 
              id="expiry_date"
              type="date" 
              value={formData.expiry_date}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
            />
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <Label>Internal Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Template Selector */}
        <div>
          <Label>PDF Template</Label>
          <Select 
            value={formData.template} 
            onValueChange={(value) => handleInputChange('template', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Future: Custom fields placeholder */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Custom fields coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorDetailsCard;
