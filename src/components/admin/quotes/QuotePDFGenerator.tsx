
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Quote, useQuoteLineItems } from '@/hooks/quotes';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { generateQuotePDF } from '@/utils/quotePDFGenerator';
import { useToast } from '@/hooks/use-toast';

interface QuotePDFGeneratorProps {
  quote: Quote;
}

const QuotePDFGenerator: React.FC<QuotePDFGeneratorProps> = ({ quote }) => {
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { data: lineItems = [] } = useQuoteLineItems(quote.id);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      await generateQuotePDF(quote, lineItems, settings, logoUrl);
      toast({
        title: "PDF Generated",
        description: "Quote PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating quote PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate quote PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownloadPDF}
      className="h-8 w-8 p-0"
      title="Download quote PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default QuotePDFGenerator;
