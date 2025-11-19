import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface QuoteEditorContractCardProps {
  value: string;
  onChange: (value: string) => void;
}

const QuoteEditorContractCard: React.FC<QuoteEditorContractCardProps> = ({
  value,
  onChange
}) => {
  return (
    <Card>
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle className="text-lg">Contract / Disclaimer</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Shown at the bottom of the quote for the client to review before approving.
        </p>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <Textarea
          id="contract_disclaimer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter terms and conditions..."
          rows={5}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
};

export default QuoteEditorContractCard;
