interface InvoiceEmailData {
  clientName: string;
  companyName: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
  portalUrl?: string;
  companyLogoUrl?: string;
  customMessage?: string;
}

export const createInvoiceEmailHTML = (data: InvoiceEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          padding: 30px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .logo { 
          max-width: 180px; 
          height: auto;
          background: white;
          padding: 10px;
          border-radius: 8px;
        }
        .content { 
          padding: 40px 30px;
        }
        .invoice-details {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .invoice-details h3 {
          margin-top: 0;
          color: #374151;
          font-size: 16px;
        }
        .invoice-details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .invoice-details li {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .invoice-details li:last-child {
          border-bottom: none;
        }
        .invoice-details strong {
          color: #1f2937;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button { 
          display: inline-block; 
          padding: 14px 32px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important; 
          text-decoration: none; 
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
        }
        .button:hover {
          box-shadow: 0 6px 8px rgba(102, 126, 234, 0.4);
        }
        .portal-note {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 15px;
        }
        .footer { 
          text-align: center; 
          padding: 20px;
          background: #f9fafb;
          color: #6b7280; 
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
        }
        h2 {
          color: #1f2937;
          margin-top: 0;
        }
        p {
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${data.companyLogoUrl ? `
          <div class="header">
            <img src="${data.companyLogoUrl}" alt="${data.companyName}" class="logo">
          </div>
        ` : `
          <div class="header" style="padding: 40px 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${data.companyName}</h1>
          </div>
        `}
        
        <div class="content">
          <h2>Invoice ${data.invoiceNumber}</h2>
          
          <p>Dear ${data.clientName},</p>
          
          ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
          
          <p>Please find attached your invoice from ${data.companyName}.</p>
          
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <ul>
              <li><strong>Invoice Number:</strong> ${data.invoiceNumber}</li>
              <li><strong>Total Amount:</strong> $${data.totalAmount}</li>
              <li><strong>Due Date:</strong> ${data.dueDate}</li>
            </ul>
          </div>
          
          ${data.portalUrl ? `
            <div class="button-container">
              <a href="${data.portalUrl}" class="button">
                View Invoice Online
              </a>
              <p class="portal-note">
                Access your client portal to view all your invoices and quotes in one place.
              </p>
            </div>
          ` : ''}
          
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          
          <p>Thank you for your business!</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>${data.companyName}</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated email from ${data.companyName}. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getInvoiceEmailSubject = (companyName: string, invoiceNumber: string): string => {
  return `Invoice ${invoiceNumber} from ${companyName}`;
};
