import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

interface ChangeOrderPDFData {
  changeOrder: any;
  jobsiteName: string;
}

export const useChangeOrderPDF = () => {
  const { user } = useAuth();

  const generateChangeOrderPDF = async ({ changeOrder, jobsiteName }: ChangeOrderPDFData) => {
    try {
      // Fetch company settings for logo and company info
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user?.companyId)
        .single();

      const pdf = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 15;
      let y = margin;

      // Header with logo
      if (companySettings?.company_logo_url) {
        try {
          const res = await fetch(companySettings.company_logo_url);
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') resolve(reader.result);
              else reject();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          pdf.addImage(base64, 'PNG', margin, y, 30, 15);
        } catch (err) {
          console.warn('Failed to load company logo:', err);
        }
      }

      // Company name
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companySettings?.company_name || 'Company Name', pageWidth / 2, y + 10, {
        align: 'center',
      });

      // Document title
      pdf.setFontSize(14);
      pdf.text('CHANGE ORDER', pageWidth / 2, y + 20, { align: 'center' });
      y += 35;

      // Change order information table
      autoTable(pdf, {
        startY: y,
        theme: 'grid',
        head: [['Change Order Information', '']],
        body: [
          ['Order Number', `CO-${changeOrder.id.slice(-8).toUpperCase()}`],
          ['Title', changeOrder.title],
          ['Jobsite', jobsiteName],
          ['Type', changeOrder.type === 'admin' ? 'Official Change Order' : 'Foreman Request'],
          ['Status', changeOrder.status.charAt(0).toUpperCase() + changeOrder.status.slice(1)],
          ['Cost', changeOrder.cost ? `$${Number(changeOrder.cost).toFixed(2)}` : 'N/A'],
          ['Created Date', new Date(changeOrder.created_at).toLocaleDateString()],
          ['Creator', changeOrder.creator ? `${changeOrder.creator.first_name} ${changeOrder.creator.last_name}` : 'Unknown'],
        ],
        margin: { left: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 'auto' },
        },
      });

      y = pdf.lastAutoTable.finalY + 10;

      // Timeline information (if available)
      if (changeOrder.start_date || changeOrder.end_date) {
        const timelineData = [];
        if (changeOrder.start_date) {
          timelineData.push(['Start Date', new Date(changeOrder.start_date).toLocaleDateString()]);
        }
        if (changeOrder.end_date) {
          timelineData.push(['End Date', new Date(changeOrder.end_date).toLocaleDateString()]);
        }

        autoTable(pdf, {
          startY: y,
          theme: 'grid',
          head: [['Timeline Information', '']],
          body: timelineData,
          margin: { left: margin },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 'auto' },
          },
        });

        y = pdf.lastAutoTable.finalY + 10;
      }

      // Description section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description:', margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descriptionLines = pdf.splitTextToSize(changeOrder.description, pageWidth - margin * 2);
      pdf.text(descriptionLines as unknown as string, margin, y);
      y += (Array.isArray(descriptionLines) ? descriptionLines.length : 1) * 5 + 10;

      // Review information (if available)
      if (changeOrder.reviewed_by || changeOrder.reviewed_at) {
        autoTable(pdf, {
          startY: y,
          theme: 'grid',
          head: [['Review Information', '']],
          body: [
            ['Reviewed By', changeOrder.reviewer ? `${changeOrder.reviewer.first_name} ${changeOrder.reviewer.last_name}` : 'N/A'],
            ['Review Date', changeOrder.reviewed_at ? new Date(changeOrder.reviewed_at).toLocaleDateString() : 'N/A'],
          ],
          margin: { left: margin },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [255, 111, 0], textColor: [255, 255, 255] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 'auto' },
          },
        });

        y = pdf.lastAutoTable.finalY + 10;
      }

      // Attachments note
      if (changeOrder.attachments && changeOrder.attachments.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Attachments:', margin, y);
        y += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`This change order includes ${changeOrder.attachments.length} attachment(s).`, margin, y);
        pdf.text('Please refer to the digital copy for full attachment details.', margin, y + 5);
        y += 15;
      }

      // Footer
      y = pdf.internal.pageSize.height - 30;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, y);
      pdf.text(`Page 1 of 1`, pageWidth - margin - 20, y);

      // Signature lines (if approved)
      if (changeOrder.status === 'approved') {
        y -= 20;
        pdf.text('Approved by: ________________________', margin, y);
        pdf.text('Date: ________________________', pageWidth - 80, y);
      }

      // Save the PDF
      const fileName = `change_order_${changeOrder.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  return { generateChangeOrderPDF };
};