import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { TransactionWithHierarchy } from '@/hooks/useHierarchicalCategories';

export type PrintOption = 'charts' | 'table' | 'full';

interface PrintArgs {
  option: PrintOption;
  transactions: TransactionWithHierarchy[];
  appliedFilters: {
    search?: string;
    dateRange?: string;
    types?: string[];
    statuses?: string[];
    categories?: string[];
    payees?: string[];
  };
}

export const usePrintIncomeExpenses = () => {
  const { toast } = useToast();
  const { settings } = useCompanySettings();

  const generatePrintContent = useCallback(async ({ option, transactions, appliedFilters }: PrintArgs) => {
    try {
      // Create a temporary container for print content
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '210mm'; // A4 width
      printContainer.style.backgroundColor = 'white';
      printContainer.style.padding = '20px';
      printContainer.style.fontFamily = 'Arial, sans-serif';
      
      document.body.appendChild(printContainer);

      // Add header
      const header = `
        <div style="margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0;">
            ${settings?.company_name || 'Company'} - Income & Expenses Report
          </h1>
          <p style="color: #64748b; margin: 0; font-size: 14px;">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
          ${appliedFilters.dateRange ? `<p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px;">Date Range: ${appliedFilters.dateRange}</p>` : ''}
          ${appliedFilters.search ? `<p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px;">Search: "${appliedFilters.search}"</p>` : ''}
        </div>
      `;

      printContainer.innerHTML = header;

      if (option === 'charts' || option === 'full') {
        // Capture KPIs
        const kpiElement = document.querySelector('[data-print="kpis"]');
        if (kpiElement) {
          const kpiCanvas = await html2canvas(kpiElement as HTMLElement, {
            backgroundColor: 'white',
            scale: 2
          });
          const kpiImg = document.createElement('img');
          kpiImg.src = kpiCanvas.toDataURL();
          kpiImg.style.width = '100%';
          kpiImg.style.marginBottom = '20px';
          printContainer.appendChild(kpiImg);
        }

        // Capture charts
        const chartsElement = document.querySelector('[data-print="charts"]');
        if (chartsElement) {
          const chartsCanvas = await html2canvas(chartsElement as HTMLElement, {
            backgroundColor: 'white',
            scale: 2
          });
          const chartsImg = document.createElement('img');
          chartsImg.src = chartsCanvas.toDataURL();
          chartsImg.style.width = '100%';
          chartsImg.style.marginBottom = '20px';
          printContainer.appendChild(chartsImg);
        }
      }

      if (option === 'table' || option === 'full') {
        // Add transaction table
        const tableDiv = document.createElement('div');
        tableDiv.style.marginTop = '20px';
        
        const tableHTML = `
          <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px;">
            Transactions (${transactions.length} items)
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">Date</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">Title</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">Category</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">Vendor/Payee</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">Amount</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">Status</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">Type</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(transaction => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">
                    ${new Date(transaction.expense_date).toLocaleDateString()}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">
                    ${transaction.expense_title}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">
                    ${transaction.subcategory_name ? 
                      `${transaction.parent_category_name} > ${transaction.subcategory_name}` : 
                      transaction.parent_category_name || 'Uncategorized'}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">
                    ${transaction.vendor_payee || '-'}
                  </td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; color: ${transaction.transaction_type === 'income' ? '#059669' : '#dc2626'};">
                    ${transaction.transaction_type === 'income' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">
                     <span style="padding: 2px 8px; border-radius: 12px; font-size: 10px; background-color: ${
                       transaction.payment_status === 'paid' ? '#dcfce7' : 
                       transaction.payment_status === 'scheduled' ? '#fef3c7' : '#fee2e2'
                     }; color: ${
                       transaction.payment_status === 'paid' ? '#166534' : 
                       transaction.payment_status === 'scheduled' ? '#92400e' : '#991b1b'
                     };">
                       ${transaction.payment_status.charAt(0).toUpperCase() + transaction.payment_status.slice(1)}
                     </span>
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">
                    <span style="padding: 2px 8px; border-radius: 12px; font-size: 10px; background-color: ${
                      transaction.transaction_type === 'income' ? '#dcfce7' : '#fee2e2'
                    }; color: ${
                      transaction.transaction_type === 'income' ? '#166534' : '#991b1b'
                    };">
                      ${transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        
        tableDiv.innerHTML = tableHTML;
        printContainer.appendChild(tableDiv);
      }

      // Generate PDF
      const canvas = await html2canvas(printContainer, {
        backgroundColor: 'white',
        scale: 1,
        useCORS: true
      });

      document.body.removeChild(printContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `income-expenses-${option}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'Print Ready',
        description: `${option.charAt(0).toUpperCase() + option.slice(1)} report has been generated successfully.`
      });

    } catch (error) {
      console.error('Print generation failed:', error);
      toast({
        title: 'Print Failed',
        description: 'Failed to generate the print document. Please try again.',
        variant: 'destructive'
      });
    }
  }, [settings, toast]);

  return { generatePrintContent };
};