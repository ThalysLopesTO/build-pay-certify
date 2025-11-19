
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Quote, useNextQuoteNumber } from '@/hooks/quotes';

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
  const [isEditingQuoteNumber, setIsEditingQuoteNumber] = useState(false);
  const [tempQuoteNumber, setTempQuoteNumber] = useState('');
  const { data: nextQuoteNumber } = useNextQuoteNumber();

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="text-lg">Quote Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Quote Number - View/Edit Toggle */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1">
            Quote Number
          </Label>
          
          {!isEditingQuoteNumber ? (
            // VIEW MODE - Like Jobber
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div>
                <span className="text-sm text-muted-foreground">Quote number </span>
                <span className="font-mono font-semibold">
                  #{formData.quote_number || nextQuoteNumber || 'QUO-####'}
                </span>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  setTempQuoteNumber(formData.quote_number || '');
                  setIsEditingQuoteNumber(true);
                }}
                className="text-green-600 hover:text-green-700 h-auto p-0"
              >
                Change
              </Button>
            </div>
          ) : (
            // EDIT MODE
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="quote_number"
                  value={tempQuoteNumber}
                  onChange={(e) => setTempQuoteNumber(e.target.value)}
                  placeholder={nextQuoteNumber || 'QUO-####'}
                  className="font-mono font-semibold flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleInputChange('quote_number', tempQuoteNumber);
                    setIsEditingQuoteNumber(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempQuoteNumber(formData.quote_number || '');
                    setIsEditingQuoteNumber(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank to use auto-generated number: {nextQuoteNumber}
              </p>
            </div>
          )}
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
