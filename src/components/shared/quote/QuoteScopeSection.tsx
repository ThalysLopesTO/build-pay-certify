import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface QuoteScopeSectionProps {
  clientMessage?: string;
  title?: string;
}

export const QuoteScopeSection = ({ 
  clientMessage, 
  title = 'Scope of Work' 
}: QuoteScopeSectionProps) => {
  // Filter out trivial content like "Plus 13% HST" or very short messages
  const isTrivialContent = (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length < 15) return true;
    // Check if it's just tax-related text
    const taxPattern = /^(plus\s+)?\d+(\.\d+)?%?\s*(hst|gst|tax|vat)?\.?$/i;
    return taxPattern.test(trimmed);
  };

  if (!clientMessage || isTrivialContent(clientMessage)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {clientMessage}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
