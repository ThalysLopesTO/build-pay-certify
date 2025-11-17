
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QuoteEditorJobSectionProps {
  formData: {
    project_name: string;
    notes: string;
  };
  handleInputChange: (field: string, value: string) => void;
}

const QuoteEditorJobSection: React.FC<QuoteEditorJobSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle className="text-lg">Job Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-6">
        <div>
          <Label htmlFor="project_name" className="text-sm">Project Name *</Label>
          <Input 
            id="project_name"
            value={formData.project_name}
            onChange={(e) => handleInputChange('project_name', e.target.value)}
            placeholder="e.g., Kitchen Renovation"
            className="text-base md:text-lg font-medium h-11 md:h-10"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="notes" className="text-sm">Scope of Work / Notes</Label>
          <Textarea 
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Describe the project scope, deliverables, timeline..."
            rows={4}
            autoComplete="off"
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorJobSection;
