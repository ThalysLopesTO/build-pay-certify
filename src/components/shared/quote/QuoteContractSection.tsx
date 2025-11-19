import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface QuoteContractSectionProps {
  disclaimer?: string;
}

export const QuoteContractSection = ({ disclaimer }: QuoteContractSectionProps) => {
  if (!disclaimer) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Contract Terms & Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {disclaimer}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
