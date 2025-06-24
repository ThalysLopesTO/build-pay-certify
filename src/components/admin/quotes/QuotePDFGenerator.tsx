
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Quote, useQuoteLineItems } from '@/hooks/quotes';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { generateClassicTemplate } from './templates/ClassicTemplate';
import { generateModernTemplate } from './templates/ModernTemplate';
import { generateConstructionTemplate } from './templates/ConstructionTemplate';

interface QuotePDFGeneratorProps {
  quote: Quote;
}

const QuotePDFGenerator: React.FC<QuotePDFGeneratorProps> = ({ quote }) => {
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { data: lineItems = [] } = useQuoteLineItems(quote.id);

  const generateQuoteHTML = () => {
    const templateProps = {
      quote,
      lineItems,
      settings,
      logoUrl
    };

    switch (quote.template || 'classic') {
      case 'modern':
        return generateModernTemplate(templateProps);
      case 'construction':
        return generateConstructionTemplate(templateProps);
      case 'classic':
      default:
        return generateClassicTemplate(templateProps);
    }
  };

  const downloadPDF = () => {
    const htmlContent = generateQuoteHTML();
    const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, '')}.pdf`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={downloadPDF}
      className="h-8 w-8 p-0"
      title="Download quote PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default QuotePDFGenerator;
