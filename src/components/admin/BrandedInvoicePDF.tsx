import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Invoice } from "./types/invoice";
import { CompanySettings } from "@/hooks/useCompanySettings";
import { fetchLogoAsBase64 } from "@/utils/logoUtils";
import { attachmentsSectionHtml, buildInvoicePdfBlob, saveInvoicePdfWithAttachments } from "@/utils/invoiceAttachmentsPdf";

// Helper function to generate the invoice HTML
const generateInvoiceHTML = (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoBase64?: string | null,
): string => {
  const subtotal = invoice.subtotal ?? 0;
  const discountPercent = invoice.discount ?? 0;
  const taxPercent = invoice.tax ?? 0;

  const discountAmount = discountPercent > 0 ? subtotal * (discountPercent / 100) : 0;

  const taxableBase = subtotal - discountAmount;
  const taxAmount = taxPercent > 0 ? taxableBase * (taxPercent / 100) : 0;

  const total = invoice.total_amount ?? taxableBase + taxAmount;

  // Status badge styling
  let statusLabel = "";
  let statusBg = "";
  let statusColor = "";

  switch (invoice.status) {
    case "paid":
      statusLabel = "PAID";
      statusBg = "#DCFCE7";
      statusColor = "#166534";
      break;
    case "overdue":
      statusLabel = "OVERDUE";
      statusBg = "#FEE2E2";
      statusColor = "#B91C1C";
      break;
    case "sent":
      statusLabel = "SENT";
      statusBg = "#DBEAFE";
      statusColor = "#1D4ED8";
      break;
    case "draft":
    default:
      if (invoice.status) {
        statusLabel = invoice.status.toUpperCase();
        statusBg = "#E5E7EB";
        statusColor = "#374151";
      }
      break;
  }

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background:#f3f4f6;
      padding:32px 0;
    ">
      <div style="
        max-width: 900px;
        margin: 0 auto;
        background:#ffffff;
        border-radius:16px;
        padding:32px 40px 40px;
        box-shadow:0 10px 25px rgba(15,23,42,0.06);
      ">
        <!-- HEADER -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px; margin-bottom:24px;">
          <div style="display:flex; align-items:center; gap:16px;">
            ${logoBase64 ? `<img src="${logoBase64}" style="max-height:40px; width:auto; object-fit:contain;" />` : ""}
            <div>
              <div style="font-size:22px; font-weight:700; color:#111827;">
                ${companySettings.company_name}
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#9CA3AF; margin-bottom:4px;">
              Invoice
            </div>
            <div style="font-size:20px; font-weight:700; color:#111827; margin-bottom:4px;">
              #${invoice.invoice_number}
            </div>
            <div style="font-size:12px; color:#6B7280;">
              <div>Date: <strong>${format(new Date(invoice.created_at), "MMM dd, yyyy")}</strong></div>
              <div>Due: <strong>${format(new Date(invoice.due_date), "MMM dd, yyyy")}</strong></div>
            </div>
            ${
              statusLabel
                ? `<div style="
                      margin-top:8px;
                      display:inline-block;
                      padding:3px 10px;
                      border-radius:999px;
                      font-size:10px;
                      font-weight:600;
                      text-transform:uppercase;
                      background:${statusBg};
                      color:${statusColor};
                    ">
                      ${statusLabel}
                   </div>`
                : ""
            }
          </div>
        </div>

        <div style="height:1px; background:#E5E7EB; margin:8px 0 24px;"></div>

        <!-- INFO ROW -->
        <div style="
          display:flex;
          justify-content:space-between;
          gap:24px;
          font-size:12px;
          color:#374151;
          margin-bottom:24px;
        ">
          <div style="flex:1; min-width:0;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#9CA3AF; margin-bottom:4px;">
              Invoice To
            </div>
            <div style="font-weight:600; margin-bottom:2px;">${invoice.client_company}</div>
            <div style="white-space:pre-line;">
              ${invoice.client_address || ""}
            </div>
            <div>${invoice.client_phone || ""}</div>
            <div>${invoice.client_email || ""}</div>
          </div>

          <div style="flex:1; min-width:0;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#9CA3AF; margin-bottom:4px;">
              Pay To
            </div>
            <div style="font-weight:600; margin-bottom:2px;">${companySettings.company_name}</div>
            <div style="white-space:pre-line;">
              ${companySettings.company_address || ""}
            </div>
            <div>${companySettings.company_phone || ""}</div>
            <div>${companySettings.company_email || ""}</div>
            ${companySettings.hst_number ? `<div style="margin-top:2px;">HST: ${companySettings.hst_number}</div>` : ""}
          </div>

          <div style="flex:0.8; min-width:0;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#9CA3AF; margin-bottom:4px;">
              Project
            </div>
            <div style="font-weight:500;">
              ${invoice.jobsites?.name || "-"}
            </div>
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <div style="border-radius:10px; overflow:hidden; border:1px solid #E5E7EB; margin-bottom:24px;">
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="background:#111827; color:#ffffff;">
                <th style="text-align:left; padding:10px 12px; font-weight:600;">Item Details</th>
                <th style="text-align:right; padding:10px 12px; font-weight:600; width:90px;">Unit Price</th>
                <th style="text-align:center; padding:10px 12px; font-weight:600; width:60px;">Qty</th>
                <th style="text-align:right; padding:10px 12px; font-weight:600; width:110px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                invoice.invoice_line_items && invoice.invoice_line_items.length > 0
                  ? invoice.invoice_line_items
                      .map(
                        (item, index) => `
                      <tr style="background:${index % 2 === 0 ? "#FFFFFF" : "#F9FAFB"};">
                        <td style="padding:9px 12px; border-top:1px solid #E5E7EB;">
                          ${item.description}
                        </td>
                        <td style="padding:9px 12px; border-top:1px solid #E5E7EB; text-align:right;">
                          $${item.unit_price.toFixed(2)}
                        </td>
                        <td style="padding:9px 12px; border-top:1px solid #E5E7EB; text-align:center;">
                          ${item.quantity}
                        </td>
                        <td style="padding:9px 12px; border-top:1px solid #E5E7EB; text-align:right;">
                          $${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    `,
                      )
                      .join("")
                  : `
                    <tr>
                      <td colspan="4" style="padding:12px; text-align:center; color:#9CA3AF; border-top:1px solid #E5E7EB;">
                        No items
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>

        <!-- PAYMENT + TOTALS -->
        <div style="display:flex; gap:24px; align-items:flex-start; margin-bottom:28px;">
          <div style="
            flex:1;
            min-width:0;
            border-radius:12px;
            border:1px solid #E5E7EB;
            background:#F9FAFB;
            padding:14px 16px;
            font-size:12px;
            color:#374151;
          ">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#9CA3AF; margin-bottom:6px;">
              Payment Info
            </div>
            <div>Please make payment to:</div>
            <div style="font-weight:600;">${companySettings.company_name}</div>
            <div>${companySettings.company_email || ""}</div>
            <div>${companySettings.company_phone || ""}</div>
          </div>

          <div style="flex:0.9; min-width:0;">
            <table style="width:100%; font-size:12px; color:#374151;">
              <tbody>
                <tr>
                  <td style="padding:3px 0;">Subtotal</td>
                  <td style="padding:3px 0; text-align:right;">
                    $${subtotal.toFixed(2)}
                  </td>
                </tr>
                ${
                  discountPercent > 0
                    ? `
                  <tr>
                    <td style="padding:3px 0;">
                      Discount <span style="color:#9CA3AF;">(${discountPercent.toFixed(2)}%)</span>
                    </td>
                    <td style="padding:3px 0; text-align:right;">
                      - $${discountAmount.toFixed(2)}
                    </td>
                  </tr>
                  `
                    : ""
                }
                ${
                  taxPercent > 0
                    ? `
                  <tr>
                    <td style="padding:3px 0;">
                      Tax <span style="color:#9CA3AF;">(${taxPercent.toFixed(2)}%)</span>
                    </td>
                    <td style="padding:3px 0; text-align:right;">
                      + $${taxAmount.toFixed(2)}
                    </td>
                  </tr>
                  `
                    : ""
                }
                <tr>
                  <td style="padding-top:8px; border-top:1px solid #E5E7EB; font-weight:600;">
                    Grand Total
                  </td>
                  <td style="padding-top:8px; border-top:1px solid #E5E7EB; font-weight:700; text-align:right;">
                    $${total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        ${attachmentsSectionHtml(invoice.attachments)}

        ${invoice.notes ? `
        <!-- TERMS -->
        <div style="font-size:11px; color:#6B7280; margin-bottom:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Terms &amp; Conditions</div>
          <div style="white-space:pre-line;">
            ${invoice.notes}
          </div>
        </div>
        ` : ''}

        <div style="text-align:center; font-size:11px; color:#6B7280; margin-top:8px;">
          <div style="font-weight:600; margin-bottom:2px;">Thank you for your business!</div>
          <div>
            ${companySettings.company_email || ""}${
              companySettings.company_email && companySettings.company_phone ? " | " : ""
            }${companySettings.company_phone || ""}
          </div>
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
  await saveInvoicePdfWithAttachments(pdf, invoice.attachments, `Invoice-${invoice.invoice_number}.pdf`);

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
  const blob = await buildInvoicePdfBlob(pdf, invoice.attachments);
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
