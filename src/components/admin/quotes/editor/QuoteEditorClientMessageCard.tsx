import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface QuoteEditorClientMessageCardProps {
  value: string;
  onChange: (value: string) => void;
}

const QuoteEditorClientMessageCard: React.FC<QuoteEditorClientMessageCardProps> = ({
  value,
  onChange
}) => {
  return (
    <Card>
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle className="text-lg">Client message</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          This message will appear on the quote sent to the client.
        </p>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <Textarea
          id="client_message"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add a personalized message for your client..."
          rows={5}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
};

export default QuoteEditorClientMessageCard;
