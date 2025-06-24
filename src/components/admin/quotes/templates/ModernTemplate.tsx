export const generateModernTemplate = ({ quote, lineItems, settings, logoUrl }: ClassicTemplateProps) => {
  const discountAmount = quote.subtotal * (quote.discount / 100);
  const taxAmount = (quote.subtotal - discountAmount) * (quote.tax / 100);
  const total = quote.subtotal - discountAmount + taxAmount;

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="Company Logo" style="max-height: 50px;" />`
    : '';

  const lineItemsHTML = lineItems.map(item => `
    <tr>
      <td>${item.description}</td>
      <td align="center">${item.quantity}</td>
      <td align="right">$${item.unitPrice.toFixed(2)}</td>
      <td align="right">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Quote - ${quote.quote_number}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 40px;
          color: #1a1a1a;
          background-color: #fff;
        }
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        h1 {
          font-size: 28px;
          margin: 0;
          color: #007bff;
        }
        .info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info div {
          width: 48%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #f0f0f0;
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #ccc;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .totals {
          margin-top: 30px;
          text-align: right;
        }
        .totals p {
          margin: 5px 0;
        }
        .footer {
          margin-top: 50px;
          font-size: 13px;
          color: #888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="top-bar">
        ${logoSection}
        <h1>Quote</h1>
      </div>

      <div class="i
