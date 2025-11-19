import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Lock } from 'lucide-react';

interface QuoteEditorInternalNotesCardProps {
  value: string;
  onChange: (value: string) => void;
}

const QuoteEditorInternalNotesCard: React.FC<QuoteEditorInternalNotesCardProps> = ({
  value,
  onChange
}) => {
  return (
    <Card>
      <CardHeader className="pb-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Internal notes</CardTitle>
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Only visible to your team. Not shown to the client.
        </p>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <Textarea
          id="internal_notes"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add internal notes for your team..."
          rows={4}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
};

export default QuoteEditorInternalNotesCard;
