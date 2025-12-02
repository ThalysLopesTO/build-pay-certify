import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Invoice } from "./types/invoice";
import { CompanySettings } from "@/hooks/useCompanySettings";
import { fetchLogoAsBase64 } from "@/utils/logoUtils";

// Helper function to generate the invoice HTML
const generateInvoiceHTML = (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoBase64?: string | null,
): string => {
  const subtotal = invoice.subtotal || 0;
  const discountPercent = invoice.discount || 0;
  const discountAmount = discountPercent !== 0 ? (subtotal * discountPercent) / 100 : 0;
  const taxableBase = subtotal - discountAmount;
  const taxPercent = invoice.tax || 0;
  const taxAmount = taxPercent !== 0 ? (taxableBase * taxPercent) / 100 : 0;
  const grandTotal = invoice.total_amount || taxableBase + taxAmount;

  const invoiceDate = invoice.created_at ? format(new Date(invoice.created_at), "MMM dd, yyyy") : "";
  const dueDate = invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : "";

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background:#f3f4f8;
      padding:24px;
    ">
      <div style="
        max-width:800px;
        margin:0 auto;
        background:#ffffff;
        border-radius:12px;
        box-shadow:0 10px 30px rgba(15,23,42,0.08);
        padding:32px 32px 24px 32px;
      ">
        <!-- HEADER -->
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:24px;
        ">
          <div style="display:flex; align-items:center; gap:16px;">
            ${
              logoBase64
                ? `<div style="height:52px; display:flex; align-items:center;">
                    <img src="${logoBase64}" style="max-height:52px; object-fit:contain;" />
                  </div>`
                : ""
            }
            <div>
              <div style="font-size:20px; font-weight:700; color:#0f172a;">
                ${companySettings.company_name || "Company Name"}
              </div>
              <div style="font-size:11px; color:#6b7280; line-height:1.4; margin-top:4px;">
                ${(companySettings.company_address || "").replace(/\n/g, "<br/>")}
                ${companySettings.company_phone ? `<br/>Phone: ${companySettings.company_phone}` : ""}
                ${companySettings.company_email ? `<br/>Email: ${companySettings.company_email}` : ""}
                ${companySettings.hst_number ? `<br/>HST: ${companySettings.hst_number}` : ""}
              </div>
            </div>
          </div>

          <div style="text-align:right;">
            <div style="
              font-size:11px;
              letter-spacing:0.28em;
              text-transform:uppercase;
              color:#6b7280;
            ">
              Invoice
            </div>
            <div style="
              font-size:28px;
              font-weight:800;
              color:#0f172a;
              margin-top:4px;
            ">
              #${invoice.invoice_number || ""}
            </div>
            <div style="margin-top:8px; font-size:12px; color:#4b5563;">
              <div>
                <span style="color:#6b7280;">Date:</span>
                <b style="color:#111827; margin-left:4px;">
                  ${invoiceDate}
                </b>
              </div>
              <div style="margin-top:2px;">
                <span style="color:#6b7280;">Due:</span>
                <b style="color:#111827; margin-left:4px;">
                  ${dueDate}
                </b>
              </div>
            </div>
            ${
              invoice.status === "paid"
                ? `
              <div style="
                margin-top:10px;
                display:inline-block;
                padding:4px 12px;
                border-radius:999px;
                background:rgba(16,185,129,0.12);
                color:#047857;
                font-size:11px;
                font-weight:700;
                text-transform:uppercase;
                letter-spacing:0.08em;
              ">
                ✓ Paid
              </div>`
                : invoice.status === "overdue"
                  ? `
              <div style="
                margin-top:10px;
                display:inline-block;
                padding:4px 12px;
                border-radius:999px;
                background:rgba(248,113,113,0.12);
                color:#b91c1c;
                font-size:11px;
                font-weight:700;
                text-transform:uppercase;
                letter-spacing:0.08em;
              ">
                Overdue
              </div>`
                  : ""
            }
          </div>
        </div>

        <!-- BILL TO / PAY TO -->
        <div style="
          display:flex;
          justify-content:space-between;
          gap:24px;
          margin-bottom:24px;
          font-size:13px;
        ">
          <div style="flex:1; min-width:0;">
            <p style="margin:0 0 4px 0; font-size:12px; color:#6b7280;">
              <b style="color:#111827;">Invoice To:</b>
            </p>
            <p style="margin:0; color:#111827; line-height:1.5;">
              ${invoice.client_company || ""}
              <br/>
              ${(invoice.client_address || "").replace(/\n/g, "<br/>")}
              ${invoice.client_phone ? `<br/>${invoice.client_phone}` : ""}
              ${invoice.client_email ? `<br/>${invoice.client_email}` : ""}
            </p>
          </div>

          <div style="flex:1; min-width:0; text-align:right;">
            <p style="margin:0 0 4px 0; font-size:12px; color:#6b7280;">
              <b style="color:#111827;">Pay To:</b>
            </p>
            <p style="margin:0; color:#111827; line-height:1.5;">
              ${companySettings.company_name || ""}
              <br/>
              ${(companySettings.company_address || "").replace(/\n/g, "<br/>")}
              ${companySettings.company_phone ? `<br/>Phone: ${companySettings.company_phone}` : ""}
              ${companySettings.company_email ? `<br/>Email: ${companySettings.company_email}` : ""}
            </p>
          </div>
        </div>

        <!-- TABLE -->
        <div style="margin-bottom:28px;">
          <div style="
            border-radius:10px;
            border:1px solid #e5e7eb;
            overflow:hidden;
          ">
            <table style="
              width:100%;
              border-collapse:collapse;
              font-size:12px;
            ">
              <thead>
                <tr>
                  <th style="
                    text-align:left;
                    padding:10px 12px;
                    background:#0f172a;
                    color:#f9fafb;
                    font-weight:600;
                    width:55%;
                  ">
                    Item Details
                  </th>
                  <th style="
                    text-align:left;
                    padding:10px 12px;
                    background:#0f172a;
                    color:#f9fafb;
                    font-weight:600;
                    width:15%;
                  ">
                    Unit Price
                  </th>
                  <th style="
                    text-align:left;
                    padding:10px 12px;
                    background:#0f172a;
                    color:#f9fafb;
                    font-weight:600;
                    width:10%;
                  ">
                    Qty
                  </th>
                  <th style="
                    text-align:right;
                    padding:10px 12px;
                    background:#0f172a;
                    color:#f9fafb;
                    font-weight:600;
                    width:20%;
                  ">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                ${
                  invoice.invoice_line_items && invoice.invoice_line_items.length
                    ? invoice.invoice_line_items
                        .map(
                          (item) => `
                    <tr>
                      <td style="
                        padding:9px 12px;
                        border-top:1px solid #e5e7eb;
                        color:#111827;
                      ">
                        ${item.description || ""}
                      </td>
                      <td style="
                        padding:9px 12px;
                        border-top:1px solid #e5e7eb;
                        color:#111827;
                      ">
                        $${item.unit_price.toFixed(2)}
                      </td>
                      <td style="
                        padding:9px 12px;
                        border-top:1px solid #e5e7eb;
                        color:#111827;
                      ">
                        ${item.quantity}
                      </td>
                      <td style="
                        padding:9px 12px;
                        border-top:1px solid #e5e7eb;
                        text-align:right;
                        color:#111827;
                      ">
                        $${item.amount.toFixed(2)}
                      </td>
                    </tr>
                  `,
                        )
                        .join("")
                    : `
                    <tr>
                      <td colspan="4" style="
                        padding:12px;
                        text-align:center;
                        border-top:1px solid #e5e7eb;
                        color:#6b7280;
                      ">
                        No items
                      </td>
                    </tr>
                  `
                }
              </tbody>
            </table>
          </div>

          <!-- FOOTER TOTALS / PAYMENT INFO -->
          <div style="
            display:flex;
            justify-content:space-between;
            gap:24px;
            margin-top:18px;
          ">
            <div style="flex:1; min-width:0; font-size:12px;">
              <p style="margin:0 0 4px 0; color:#6b7280;">
                <b style="color:#111827;">Payment Info:</b>
              </p>
              <p style="margin:0; color:#111827; line-height:1.5;">
                Please make payment to:
                <br/>
                <b>${companySettings.company_name || ""}</b>
                ${companySettings.company_email ? `<br/>${companySettings.company_email}` : ""}
                ${companySettings.company_phone ? `<br/>${companySettings.company_phone}` : ""}
              </p>
            </div>

            <div style="flex:0 0 260px;">
              <table style="
                width:100%;
                font-size:12px;
                border-collapse:collapse;
              ">
                <tbody>
                  <tr>
                    <td style="
                      padding:4px 0;
                      color:#4b5563;
                    ">
                      Subtotal
                    </td>
                    <td style="
                      padding:4px 0;
                      text-align:right;
                      color:#111827;
                    ">
                      $${subtotal.toFixed(2)}
                    </td>
                  </tr>
                  ${
                    discountPercent
                      ? `
                    <tr>
                      <td style="padding:2px 0; color:#4b5563;">
                        Discount <span style="color:#9ca3af;">(${discountPercent.toFixed(2)}%)</span>
                      </td>
                      <td style="
                        padding:2px 0;
                        text-align:right;
                        color:#b91c1c;
                      ">
                        - $${discountAmount.toFixed(2)}
                      </td>
                    </tr>`
                      : ""
                  }
                  ${
                    taxPercent
                      ? `
                    <tr>
                      <td style="padding:2px 0; color:#4b5563;">
                        Tax <span style="color:#9ca3af;">(${taxPercent.toFixed(2)}%)</span>
                      </td>
                      <td style="
                        padding:2px 0;
                        text-align:right;
                        color:#111827;
                      ">
                        + $${taxAmount.toFixed(2)}
                      </td>
                    </tr>`
                      : ""
                  }
                  <tr>
                    <td style="
                      padding-top:8px;
                      border-top:1px solid #e5e7eb;
                      font-weight:700;
                      color:#111827;
                      font-size:13px;
                    ">
                      Grand Total
                    </td>
                    <td style="
                      padding-top:8px;
                      border-top:1px solid #e5e7eb;
                      text-align:right;
                      font-weight:700;
                      color:#111827;
                      font-size:13px;
                    ">
                      $${grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TERMS & FOOTER -->
        <div style="
          margin-top:12px;
          padding:12px 0 4px 0;
          border-top:1px solid #e5e7eb;
          font-size:11px;
        ">
          <p style="margin:0 0 4px 0; color:#111827;">
            <b>Terms &amp; Conditions:</b>
          </p>
          <ul style="
            margin:0;
            padding-left:18px;
            color:#6b7280;
            line-height:1.6;
          ">
            <li>
              All claims relating to quantity or billing errors must be submitted in writing within 30 days of the invoice date.
            </li>
            <li>
              Payment is due by the due date indicated above. Late payments may be subject to additional charges.
            </li>
          </ul>
        </div>

        <div style="
          margin-top:10px;
          text-align:center;
          font-size:11px;
          color:#9ca3af;
        ">
          <strong style="color:#4b5563;">Thank you for your business!</strong><br/>
          ${companySettings.company_email || ""}${
            companySettings.company_email && companySettings.company_phone ? " | " : ""
          }${companySettings.company_phone || ""}
        </div>
      </div>
    </div>
  `;
};

// Download PDF function
export const generateBrandedInvoicePDF = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoUrl?: string | null,
) => {
  // Convert logo to base64 to avoid CORS issues with html2canvas
  let logoBase64 = "";
  if (logoUrl) {
    logoBase64 = await fetchLogoAsBase64(logoUrl);
  }

  // Create a hidden div to render the invoice content as HTML
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "794px"; // A4 width in pixels at 96dpi
  container.innerHTML = generateInvoiceHTML(invoice, companySettings, logoBase64);

  document.body.appendChild(container);

  // Render HTML to canvas then to PDF (reduced scale for smaller file size)
  const canvas = await html2canvas(container, {
    scale: 1.5,
    logging: false,
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  pdf.save(`Invoice-${invoice.invoice_number}.pdf`);

  document.body.removeChild(container);
};

// Generate PDF as Blob for email attachments
export const generateBrandedInvoicePDFBlob = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoUrl?: string | null,
): Promise<{ blob: Blob; filename: string }> => {
  // Convert logo to base64 to avoid CORS issues with html2canvas
  let logoBase64 = "";
  if (logoUrl) {
    logoBase64 = await fetchLogoAsBase64(logoUrl);
  }

  // Create a hidden div to render the invoice content as HTML
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "794px"; // A4 width in pixels at 96dpi
  container.innerHTML = generateInvoiceHTML(invoice, companySettings, logoBase64);

  document.body.appendChild(container);

  // Render HTML to canvas then to PDF (reduced scale for smaller file size)
  const canvas = await html2canvas(container, {
    scale: 1.5,
    logging: false,
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

  const blob = pdf.output("blob");
  const filename = `Invoice-${invoice.invoice_number}.pdf`;

  document.body.removeChild(container);

  return { blob, filename };
};

// Helper function to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Content = base64.split(",")[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
