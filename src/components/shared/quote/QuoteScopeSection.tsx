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
  if (!clientMessage) {
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
