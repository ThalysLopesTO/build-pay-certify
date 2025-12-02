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
  const subtotal = invoice.subtotal ?? 0;

  const discountPercent = invoice.discount || 0;
  const discountAmount = discountPercent ? (subtotal * discountPercent) / 100 : 0;

  const taxPercent = invoice.tax || 0;
  const taxableBase = subtotal - discountAmount;
  const taxAmount = taxPercent ? (taxableBase * taxPercent) / 100 : 0;

  const total = invoice.total_amount ?? Number((taxableBase + taxAmount).toFixed(2));

  const status = (invoice.status || "draft").toLowerCase();

  let statusLabel = "DRAFT";
  let statusBg = "#e5e7eb";
  let statusColor = "#374151";

  if (status === "paid") {
    statusLabel = "PAID";
    statusBg = "#dcfce7";
    statusColor = "#16a34a";
  } else if (status === "sent") {
    statusLabel = "SENT";
    statusBg = "#dbeafe";
    statusColor = "#1d4ed8";
  } else if (status === "overdue") {
    statusLabel = "OVERDUE";
    statusBg = "#fee2e2";
    statusColor = "#dc2626";
  }

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f3f4f6; padding:32px;">
      <div style="max-width:900px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px 40px; box-shadow:0 10px 30px rgba(15,23,42,0.1);">
        
        <!-- HEADER -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px; margin-bottom:28px;">
          <div style="display:flex; align-items:flex-start; gap:16px;">
            ${logoBase64 ? `<img src="${logoBase64}" style="max-height:56px; object-fit:contain;"/>` : ""}
            <div>
              <div style="font-size:22px; font-weight:700; color:#0f172a;">
                ${companySettings.company_name}
              </div>
              <div style="font-size:11px; color:#6b7280; margin-top:4px; line-height:1.4;">
                ${companySettings.company_address || ""}
                ${companySettings.company_email ? `<br/>${companySettings.company_email}` : ""}
                ${companySettings.company_phone ? `<br/>${companySettings.company_phone}` : ""}
                ${companySettings.hst_number ? `<br/>HST: ${companySettings.hst_number}` : ""}
              </div>
            </div>
          </div>

          <div style="text-align:right;">
            <div style="letter-spacing:0.25em; font-size:10px; text-transform:uppercase; color:#9ca3af; margin-bottom:4px;">
              Invoice
            </div>
            <div style="font-size:22px; font-weight:800; color:#111827; margin-bottom:4px;">
              #${invoice.invoice_number}
            </div>
            <div style="font-size:11px; color:#6b7280; margin-bottom:8px;">
              <div>Date: <strong>${format(new Date(invoice.created_at), "MMM dd, yyyy")}</strong></div>
              <div>Due: <strong>${format(new Date(invoice.due_date), "MMM dd, yyyy")}</strong></div>
            </div>
            <div style="display:inline-block; padding:4px 10px; border-radius:999px; font-size:10px; font-weight:600; background:${statusBg}; color:${statusColor}; text-transform:uppercase;">
              ${statusLabel}
            </div>
          </div>
        </div>

        <div style="height:1px; background:linear-gradient(to right, #e5e7eb, #f3f4f6); margin-bottom:20px;"></div>

        <!-- BILL TO / PAY TO / PROJECT -->
        <div style="display:flex; justify-content:space-between; gap:24px; margin-bottom:24px; font-size:12px; color:#111827;">
          <div style="flex:1;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; margin-bottom:4px;">
              Invoice To
            </div>
            <div style="font-weight:600; margin-bottom:2px;">${invoice.client_company || ""}</div>
            <div style="color:#4b5563; line-height:1.4;">
              ${invoice.client_address || ""}<br/>
              ${invoice.client_phone || ""}<br/>
              ${invoice.client_email || ""}
            </div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; margin-bottom:4px;">
              Pay To
            </div>
            <div style="font-weight:600; margin-bottom:2px;">${companySettings.company_name}</div>
            <div style="color:#4b5563; line-height:1.4;">
              ${companySettings.company_address || ""}<br/>
              ${companySettings.company_email || ""}<br/>
              ${companySettings.company_phone || ""}
            </div>
          </div>
          <div style="flex:0.9;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; margin-bottom:4px;">
              Project
            </div>
            <div style="color:#4b5563; line-height:1.4;">
              ${invoice.jobsites?.name || "-"}
            </div>
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <div style="border-radius:12px; overflow:hidden; border:1px solid #e5e7eb; margin-bottom:24px;">
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="background:#020617; color:#f9fafb;">
                <th style="padding:10px 14px; text-align:left; font-weight:600; width:45%;">Item Details</th>
                <th style="padding:10px 14px; text-align:right; font-weight:600; width:18%;">Unit Price</th>
                <th style="padding:10px 14px; text-align:center; font-weight:600; width:10%;">Qty</th>
                <th style="padding:10px 14px; text-align:right; font-weight:600; width:18%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                invoice.invoice_line_items && invoice.invoice_line_items.length
                  ? invoice.invoice_line_items
                      .map(
                        (item, index) => `
                  <tr style="background:${index % 2 === 0 ? "#ffffff" : "#f9fafb"}; color:#111827;">
                    <td style="padding:9px 14px; border-top:1px solid #e5e7eb;">
                      <div style="font-weight:500;">${item.description || "Item"}</div>
                    </td>
                    <td style="padding:9px 14px; border-top:1px solid #e5e7eb; text-align:right;">
                      $${item.unit_price.toFixed(2)}
                    </td>
                    <td style="padding:9px 14px; border-top:1px solid #e5e7eb; text-align:center;">
                      ${item.quantity}
                    </td>
                    <td style="padding:9px 14px; border-top:1px solid #e5e7eb; text-align:right;">
                      $${item.amount.toFixed(2)}
                    </td>
                  </tr>
                `,
                      )
                      .join("")
                  : `
                  <tr>
                    <td colspan="4" style="padding:12px 14px; text-align:center; color:#6b7280;">
                      No items
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </div>

        <!-- PAYMENT + SUMMARY -->
        <div style="display:flex; justify-content:space-between; gap:24px; margin-bottom:24px; font-size:12px;">
          <div style="flex:1; border-radius:10px; border:1px solid #e5e7eb; padding:12px 14px; background:#f9fafb;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; margin-bottom:4px;">
              Payment Info
            </div>
            <div style="color:#111827; line-height:1.5;">
              <div>Please make payment to:</div>
              <div style="font-weight:600;">${companySettings.company_name}</div>
              ${companySettings.company_email ? `<div>${companySettings.company_email}</div>` : ""}
              ${companySettings.company_phone ? `<div>${companySettings.company_phone}</div>` : ""}
            </div>
          </div>

          <div style="flex:0.9;">
            <table style="width:100%; font-size:12px; color:#111827;">
              <tbody>
                <tr>
                  <td style="padding:3px 0;">Subtotal</td>
                  <td style="padding:3px 0; text-align:right;">$${subtotal.toFixed(2)}</td>
                </tr>
                ${
                  discountPercent
                    ? `
                  <tr>
                    <td style="padding:3px 0;">Discount <span style="color:#6b7280;">(${discountPercent.toFixed(
                      2,
                    )}%)</span></td>
                    <td style="padding:3px 0; text-align:right;">- $${discountAmount.toFixed(2)}</td>
                  </tr>
                  `
                    : ""
                }
                ${
                  taxPercent
                    ? `
                  <tr>
                    <td style="padding:3px 0;">Tax <span style="color:#6b7280;">(${taxPercent.toFixed(2)}%)</span></td>
                    <td style="padding:3px 0; text-align:right;">+ $${taxAmount.toFixed(2)}</td>
                  </tr>
                  `
                    : ""
                }
                <tr>
                  <td style="padding-top:8px; border-top:1px solid #e5e7eb; font-weight:700;">
                    Grand Total
                  </td>
                  <td style="padding-top:8px; border-top:1px solid #e5e7eb; text-align:right; font-weight:700;">
                    $${total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TERMS -->
        <div style="border-top:1px solid #e5e7eb; padding-top:14px; margin-top:8px; font-size:11px; color:#4b5563;">
          <div style="font-weight:600; margin-bottom:4px;">Terms &amp; Conditions</div>
          <div style="line-height:1.5;">
            All claims relating to quantity or billing errors must be submitted in writing within 30 days of the invoice date.
            Payment is due by the due date indicated above. Late payments may be subject to additional charges.
          </div>
        </div>

        <!-- FOOTER -->
        <div style="margin-top:18px; text-align:center; font-size:11px; color:#6b7280;">
          <div style="font-weight:600; color:#111827;">Thank you for your business!</div>
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
