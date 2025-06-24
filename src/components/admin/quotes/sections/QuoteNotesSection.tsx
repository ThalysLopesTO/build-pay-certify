
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface QuoteNotesSectionProps {
  notes: string;
  handleInputChange: (field: string, value: string) => void;
}

const QuoteNotesSection: React.FC<QuoteNotesSectionProps> = ({
  notes,
  handleInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional notes or terms..."
          rows={4}
          autoComplete="off"
        />
      </CardContent>
    </Card>
  );
};

export default QuoteNotesSection;
