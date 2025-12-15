import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PortalInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PortalInvoice {
  id: string;
  invoice_number: string;
  title: string;
  status: string;
  due_date: string;
  sent_date: string | null;
  client_address: string | null;
  subtotal: number;
  discount: number | null;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  line_items: PortalInvoiceLineItem[];
}

interface CompanySettings {
  company_name: string;
  company_email?: string | null;
  company_phone?: string | null;
  company_address?: string | null;
  company_logo_url?: string | null;
  hst_number?: string | null;
  timezone?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return '#22c55e';
    case 'pending':
      return '#f59e0b';
    case 'overdue':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export const generatePortalInvoicePDF = async (
  invoice: PortalInvoice,
  companySettings?: CompanySettings | null
): Promise<void> => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending';
  const displayStatus = isOverdue ? 'overdue' : invoice.status;

  const logoHtml = companySettings?.company_logo_url
    ? `<img src="${companySettings.company_logo_url}" alt="Company Logo" style="max-height: 60px; max-width: 200px; object-fit: contain;" crossorigin="anonymous" />`
    : '';

  const lineItemsHtml = invoice.line_items?.length
    ? invoice.line_items
        .map(
          (item, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${formatCurrency(item.amount)}</td>
        </tr>
      `
        )
        .join('')
    : '';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
        <div>
          ${logoHtml}
          <h2 style="margin: 10px 0 5px 0; color: #1f2937; font-size: 20px;">${companySettings?.company_name || 'Company Name'}</h2>
          ${companySettings?.company_address ? `<p style="margin: 2px 0; color: #6b7280; font-size: 13px;">${companySettings.company_address}</p>` : ''}
          ${companySettings?.company_phone ? `<p style="margin: 2px 0; color: #6b7280; font-size: 13px;">Phone: ${companySettings.company_phone}</p>` : ''}
          ${companySettings?.company_email ? `<p style="margin: 2px 0; color: #6b7280; font-size: 13px;">Email: ${companySettings.company_email}</p>` : ''}
          ${companySettings?.hst_number ? `<p style="margin: 2px 0; color: #6b7280; font-size: 13px;">HST #: ${companySettings.hst_number}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <h1 style="margin: 0; color: #3b82f6; font-size: 36px; font-weight: bold;">INVOICE</h1>
          <p style="margin: 5px 0; font-size: 16px; font-weight: 600;">${invoice.invoice_number}</p>
          <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: ${getStatusColor(displayStatus)}20; color: ${getStatusColor(displayStatus)};">
            ${displayStatus}
          </span>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Invoice For</h3>
          <p style="margin: 0; font-weight: 600; font-size: 16px;">${invoice.title}</p>
          ${invoice.client_address ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${invoice.client_address}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 10px;">
            <span style="color: #6b7280; font-size: 13px;">Issue Date:</span>
            <span style="font-weight: 500; margin-left: 10px;">${invoice.sent_date ? formatDate(invoice.sent_date) : 'N/A'}</span>
          </div>
          <div>
            <span style="color: #6b7280; font-size: 13px;">Due Date:</span>
            <span style="font-weight: 500; margin-left: 10px; ${isOverdue ? 'color: #ef4444;' : ''}">${formatDate(invoice.due_date)}</span>
          </div>
        </div>
      </div>

      <!-- Line Items Table -->
      ${
        invoice.line_items?.length
          ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>
      `
          : ''
      }

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          ${
            invoice.subtotal > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Subtotal</span>
              <span style="font-weight: 500;">${formatCurrency(invoice.subtotal)}</span>
            </div>
          `
              : ''
          }
          ${
            invoice.discount && invoice.discount > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Discount</span>
              <span style="font-weight: 500; color: #22c55e;">-${formatCurrency(invoice.discount)}</span>
            </div>
          `
              : ''
          }
          ${
            invoice.tax_amount > 0
              ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Tax (${invoice.tax_rate.toFixed(2)}%)</span>
              <span style="font-weight: 500;">+${formatCurrency(invoice.tax_amount)}</span>
            </div>
          `
              : ''
          }
          <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid #1f2937;">
            <span style="font-weight: 700; font-size: 16px;">Total Amount</span>
            <span style="font-weight: 700; font-size: 20px; color: #3b82f6;">${formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${
        invoice.notes
          ? `
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">Notes</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px; white-space: pre-wrap;">${invoice.notes}</p>
        </div>
      `
          : ''
      }

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Thank you for your business!</p>
        ${companySettings?.company_name ? `<p style="margin: 5px 0 0 0;">${companySettings.company_name}</p>` : ''}
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Wait for images to load
  const images = container.getElementsByTagName('img');
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          }
        })
    )
  );

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${invoice.invoice_number}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};
