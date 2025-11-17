
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClientSelector from './ClientSelector';

interface Client {
  id: string;
  client_name: string;
  client_company?: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
}

interface QuoteEditorClientSectionProps {
  selectedClientId?: string;
  onClientSelect: (client: Client) => void;
}

const QuoteEditorClientSection: React.FC<QuoteEditorClientSectionProps> = ({
  selectedClientId,
  onClientSelect,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Client Information</CardTitle>
          <Badge variant="outline" className="text-xs">Required</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientSelect={onClientSelect}
        />
      </CardContent>
    </Card>
  );
};

export default QuoteEditorClientSection;
