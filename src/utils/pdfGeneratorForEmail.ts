// pdfGeneratorForEmail.ts
// ------------------------------------------------------------
// HTML → canvas → PDF generator for emailing Invoices & Quotes
// Polished templates, brand-safe, and PDF-friendly styles.
// ------------------------------------------------------------

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Invoice } from "@/components/admin/types/invoice";
import { Quote, QuoteLineItem } from "@/hooks/quotes";
import { CompanySettings } from "@/hooks/useCompanySettings";

/* ===========================================================
   Public API
   =========================================================== */

// Generate Invoice PDF as Blob for email attachment
export const generateInvoicePDFBlob = async (
  invoice: Invoice,
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const temp = prepareOffscreen();
    temp.innerHTML = await generateInvoiceHTML(invoice, companySettings, logoUrl);
    document.body.appendChild(temp);

    const canvas = await html2canvas(temp, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(temp);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    addCanvasToPdf(canvas, pdf);

    // Optional watermark for non-paid invoices
    if ((invoice.status ?? "").toLowerCase() !== "paid") {
      addWatermark(pdf, (invoice.status ?? "DRAFT").toUpperCase());
    }

    const blob = pdf.output("blob");
    const filename = `Invoice_${invoice.invoice_number || invoice.id}.pdf`;
    return { blob, filename };
  } catch (error) {
    console.error("Error generating invoice PDF blob:", error);
    throw error;
  }
};

// Generate Quote PDF as Blob for email attachment
export const generateQuotePDFBlob = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const temp = prepareOffscreen();
    temp.innerHTML = await generateQuoteHTML(quote, lineItems, companySettings, logoUrl);
    document.body.appendChild(temp);

    const canvas = await html2canvas(temp, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(temp);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    addCanvasToPdf(canvas, pdf);

    // Optional watermark for non-accepted quotes
    if ((quote.status ?? "").toLowerCase() !== "accepted") {
      addWatermark(pdf, (quote.status ?? "DRAFT").toUpperCase());
    }

    const blob = pdf.output("blob");
    const filename = `Quote_${quote.quote_number}.pdf`;
    return { blob, filename };
  } catch (error) {
    console.error("Error generating quote PDF blob:", error);
    throw error;
  }
};

// Convert Blob → base64 (without data: prefix)
export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1] ?? "");
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/* ===========================================================
   HTML Templates
   =========================================================== */

const generateInvoiceHTML = async (
  invoice: Invoice,
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<string> => {
  const currency = "USD";

  const lineItems = (invoice.invoice_line_items ?? []) as Array<{
    description?: string;
    amount?: number;
    notes?: string;
  }>;

  const subtotal =
    invoice.subtotal ??
    lineItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const taxPct = Number(invoice.tax) || 0;
  const taxAmount = subtotal * (taxPct / 100);
  const total = invoice.total_amount ?? subtotal + taxAmount;

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="paper">
        <!-- Header -->
        <div class="header">
          ${renderBrand(logoUrl, companySettings?.company_name ?? "Your Company")}
          <div class="meta">
            <h1 class="title">INVOICE</h1>
            <div class="kv">Invoice #: <b>${invoice.invoice_number || invoice.id}</b></div>
            <div class="kv">Date: <b>${formatDate(new Date())}</b></div>
            <div class="kv">Due Date: <b>${formatDate(invoice.due_date)}</b></div>
            <span class="${statusClass(invoice.status)}">${(invoice.status ?? "draft").toUpperCase()}</span>
          </div>
        </div>

        <!-- Parties -->
        <div class="grid-2">
          <div class="card">
            <h4>Bill To</h4>
            <div><b>${sanitize(invoice.client_company) || "Client"}</b></div>
            ${invoice.client_email ? `<div class="muted">${sanitize(invoice.client_email)}</div>` : ""}
          </div>
          <div class="card">
            <h4>From</h4>
            <div><b>${sanitize(companySettings?.company_name) || "Your Company"}</b></div>
            ${companySettings?.company_address ? `<div class="muted">${sanitize(companySettings.company_address)}</div>` : ""}
            ${companySettings?.company_phone ? `<div class="muted">${sanitize(companySettings.company_phone)}</div>` : ""}
            ${companySettings?.company_email ? `<div class="muted">${sanitize(companySettings.company_email)}</div>` : ""}
          </div>
        </div>

        <!-- Items -->
        <table role="table" aria-label="Invoice items">
          <thead>
            <tr>
              <th>Description</th>
              <th class="ta-r">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems
              .map(
                (it) => `
              <tr>
                <td>
                  <div><b>${sanitize(it.description) || "Line item"}</b></div>
                  ${it.notes ? `<div class="desc">${sanitize(it.notes)}</div>` : ""}
                </td>
                <td class="ta-r">${formatCurrency(Number(it.amount) || 0, currency)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-wrap">
          <div class="summary">
            <div class="row-sum"><span class="label">Subtotal</span><span>${formatCurrency(subtotal, currency)}</span></div>
            ${taxPct ? `<div class="row-sum"><span class="label">Tax (${taxPct}%)</span><span>${formatCurrency(taxAmount, currency)}</span></div>` : ""}
            <div class="row-sum total"><span>Total</span><span>${formatCurrency(total, currency)}</span></div>
          </div>
        </div>

        <!-- Notes -->
        ${
          invoice.notes
            ? `
          <section class="notes">
            <h4>Notes</h4>
            <div>${sanitize(invoice.notes)}</div>
          </section>`
            : ""
        }

        <!-- Footer -->
        <div class="footer">
          Thank you for your business.${
            companySettings?.company_name
              ? ` &nbsp;© ${new Date().getFullYear()} ${sanitize(companySettings.company_name)}`
              : ""
          }
        </div>
      </div>
    </body>
  </html>
  `;
};

const generateQuoteHTML = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<string> => {
  const currency = "USD";

  const subtotal =
    quote.subtotal ??
    lineItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const discountPct = Number(quote.discount) || 0;
  const discount = subtotal * (discountPct / 100);

  const taxedBase = subtotal - discount;

  const taxPct = Number(quote.tax) || 0;
  const taxAmount = taxedBase * (taxPct / 100);

  const total = quote.total_amount ?? taxedBase + taxAmount;

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="paper">
        <!-- Header -->
        <div class="header">
          ${renderBrand(logoUrl, companySettings?.company_name ?? "Your Company")}
          <div class="meta">
            <h1 class="title">QUOTE</h1>
            <div class="kv">Quote #: <b>${sanitize(quote.quote_number)}</b></div>
            <div class="kv">Date: <b>${formatDate(quote.created_at)}</b></div>
            <div class="kv">Valid Until: <b>${formatDate(quote.expiry_date)}</b></div>
            <span class="${statusClass(quote.status)}">${(quote.status ?? "draft").toUpperCase()}</span>
          </div>
        </div>

        <!-- Parties -->
        <div class="grid-2">
          <div class="card">
            <h4>Quote For</h4>
            <div><b>${sanitize(quote.client_name) || sanitize(quote.client_company) || "Client"}</b></div>
            ${quote.client_company ? `<div class="muted">${sanitize(quote.client_company)}</div>` : ""}
            ${quote.client_email ? `<div class="muted">${sanitize(quote.client_email)}</div>` : ""}
            ${quote.project_name ? `<div class="muted"><b>Project:</b> ${sanitize(quote.project_name)}</div>` : ""}
          </div>
          <div class="card">
            <h4>From</h4>
            <div><b>${sanitize(companySettings?.company_name) || "Your Company"}</b></div>
            ${companySettings?.company_address ? `<div class="muted">${sanitize(companySettings.company_address)}</div>` : ""}
            ${companySettings?.company_phone ? `<div class="muted">${sanitize(companySettings.company_phone)}</div>` : ""}
            ${companySettings?.company_email ? `<div class="muted">${sanitize(companySettings.company_email)}</div>` : ""}
          </div>
        </div>

        <!-- Items -->
        <table role="table" aria-label="Quote items">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th class="ta-r">Unit Price</th>
              <th class="ta-r">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems
              .map(
                (it) => `
              <tr>
                <td><div><b>${sanitize(it.description) || "Line item"}</b></div></td>
                <td>${Number(it.quantity) || 1}</td>
                <td class="ta-r">${formatCurrency(Number(it.unit_price) || 0, currency)}</td>
                <td class="ta-r">${formatCurrency(Number(it.amount) || 0, currency)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-wrap">
          <div class="summary">
            <div class="row-sum"><span class="label">Subtotal</span><span>${formatCurrency(subtotal, currency)}</span></div>
            ${
              discountPct
                ? `<div class="row-sum"><span class="label">Discount (${discountPct}%)</span><span>-${formatCurrency(discount, currency)}</span></div>`
                : ""
            }
            ${
              taxPct
                ? `<div class="row-sum"><span class="label">Tax (${taxPct}%)</span><span>${formatCurrency(taxAmount, currency)}</span></div>`
                : ""
            }
            <div class="row-sum total"><span>Total</span><span>${formatCurrency(total, currency)}</span></div>
          </div>
        </div>

        <!-- Notes -->
        ${
          quote.notes
            ? `
          <section class="notes">
            <h4>Notes</h4>
            <div>${sanitize(quote.notes)}</div>
          </section>`
            : ""
        }

        <!-- Footer -->
        <div class="footer">
          Thank you for considering us.${
            companySettings?.company_name
              ? ` &nbsp;© ${new Date().getFullYear()} ${sanitize(companySettings.company_name)}`
              : ""
          }
        </div>
      </div>
    </body>
  </html>
  `;
};

/* ===========================================================
   Helpers (layout, math, safety, PDF placement)
   =========================================================== */

// A4 canvas width at 96DPI (html2canvas friendly) - increased for better content fit
const A4_CANVAS_WIDTH = 850;

// Prepare an offscreen container for rendering HTML
const prepareOffscreen = () => {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  el.style.top = "-9999px";
  el.style.width = `${A4_CANVAS_WIDTH}px`;
  el.style.background = "white";
  el.style.padding = "60px";
  el.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans"';
  return el;
};

// Fit canvas to the PDF page while preserving aspect ratio; center the image
const addCanvasToPdf = (canvas: HTMLCanvasElement, pdf: jsPDF) => {
  const imgData = canvas.toDataURL("image/png");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pdfW - w) / 2;
  const y = (pdfH - h) / 2;
  pdf.addImage(imgData, "PNG", x, y, w, h);
};

// Watermark helper (diagonal center)
const addWatermark = (pdf: jsPDF, text: string) => {
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(50);
  pdf.setTextColor(200, 200, 200);
  pdf.text(text, pdfW / 2, pdfH / 2, { align: "center", angle: 45 });
};

// Simple sanitizer for injected content (keeps it light for known fields)
const sanitize = (v: any): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Currency/date helpers
const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount ?? 0);

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// Brand block + status styles used inside HTML templates
const renderBrand = (logoUrl?: string | null, companyName?: string | null) => {
  if (logoUrl) {
    return `
      <div class="brand">
        <img class="brand-logo" src="${logoUrl}" alt="${sanitize(companyName) || "Company"} logo" />
        <div class="brand-text">
          <div class="brand-name">${sanitize(companyName) || ""}</div>
        </div>
      </div>`;
  }
  return `
    <div class="brand brand--textonly">
      <div class="brand-mark">◆</div>
      <div class="brand-text">
        <div class="brand-name">${sanitize(companyName) || ""}</div>
        <div class="brand-tag muted">Invoice</div>
      </div>
    </div>`;
};

const statusClass = (s?: string) => {
  switch ((s ?? "draft").toLowerCase()) {
    case "paid":
    case "accepted":
      return "status status--paid";
    case "pending":
    case "sent":
      return "status status--pending";
    case "overdue":
    case "declined":
      return "status status--overdue";
    default:
      return "status status--draft";
  }
};

// Shared CSS used by both templates (kept inline for html2canvas reliability)
const baseStyles = `
  :root{
    --ink:#0f172a;         /* heading ink */
    --text:#1f2937;        /* body text */
    --muted:#64748b;       /* labels */
    --border:#e2e8f0;      /* lines */
    --zebra:#f8fafc;       /* row alt */
    --header:#f1f5f9;      /* table head */
    --paid:#16a34a;        /* green */
    --warn:#f59e0b;        /* amber */
    --bad:#ef4444;         /* red */
    --accent:#3b82f6;      /* blue accent */
  }
  *{ box-sizing:border-box; }
  body{ margin:0; padding:0; color:var(--text); font:14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans"; }
  .paper{ width:${A4_CANVAS_WIDTH}px; background:#fff; padding:60px; }

  .row{ display:flex; gap:32px; }
  .space{ height:24px; }

  /* Header - Improved spacing and layout */
  .header{ display:flex; justify-content:space-between; align-items:flex-start; gap:40px; padding-bottom:32px; border-bottom:2px solid var(--border); margin-bottom:32px; }
  .brand{ display:flex; align-items:center; gap:18px; }
  .brand--textonly .brand-mark{ width:56px; height:56px; display:grid; place-items:center; background:var(--accent); color:#fff; border-radius:12px; font-weight:800; font-size:18px; }
  .brand-logo{ width:140px; height:70px; object-fit:contain; }
  .brand-name{ font-weight:800; font-size:22px; color:var(--ink); letter-spacing:.3px; line-height:1.2; }
  .brand-tag{ font-size:12px; letter-spacing:.4px; text-transform:uppercase; margin-top:4px; }

  .meta{ text-align:right; min-width:280px; }
  .title{ font-size:36px; font-weight:800; margin:0 0 16px; letter-spacing:.5px; color:var(--accent); text-transform:uppercase; }
  .kv{ font-size:14px; color:var(--muted); margin-bottom:8px; line-height:1.4; }
  .kv b{ color:var(--text); font-weight:700; }

  /* status pill - Enhanced design */
  .status{ display:inline-block; margin-top:16px; padding:8px 16px; border-radius:999px; color:#fff; font-size:12px; font-weight:700; letter-spacing:.4px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
  .status--paid{ background:linear-gradient(135deg, var(--paid), #22c55e); }
  .status--pending{ background:linear-gradient(135deg, var(--warn), #fbbf24); }
  .status--overdue{ background:linear-gradient(135deg, var(--bad), #f87171); }
  .status--draft{ background:linear-gradient(135deg, #94a3b8, #cbd5e1); }

  /* Cards - Enhanced spacing and visual design */
  .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:28px; margin:32px 0; }
  .card{ border:1px solid var(--border); border-radius:12px; padding:24px; background:#fefefe; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
  .card h4{ margin:0 0 12px; color:var(--ink); font-size:13px; text-transform:uppercase; letter-spacing:.6px; font-weight:700; }
  .card div{ margin-bottom:6px; line-height:1.4; }
  .card div:last-child{ margin-bottom:0; }
  .muted{ color:var(--muted); font-size:13px; }

  /* Table - Better spacing and column widths */
  table{ width:100%; border-collapse:separate; border-spacing:0; margin:32px 0; border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  thead th{
    text-align:left; padding:16px 20px; font-size:12px; text-transform:uppercase; letter-spacing:.6px; color:var(--ink); font-weight:700;
    background:linear-gradient(135deg, var(--header), #f8fafc); border-bottom:2px solid var(--border);
  }
  thead th:first-child{ width:60%; }
  thead th:last-child{ width:40%; text-align:right; }
  tbody td{ padding:20px; border-bottom:1px solid var(--border); vertical-align:top; line-height:1.5; }
  tbody td:first-child{ width:60%; }
  tbody td:last-child{ width:40%; text-align:right; font-weight:600; }
  tbody tr:nth-child(even) td{ background:var(--zebra); }
  tbody tr:last-child td{ border-bottom:none; }
  .desc{ font-size:13px; color:var(--muted); margin-top:6px; line-height:1.4; }

  /* Summary - Better sizing and positioning */
  .summary-wrap{ display:flex; justify-content:flex-end; margin:32px 0; }
  .summary{ width:280px; border:1px solid var(--border); border-radius:12px; padding:24px; background:#fefefe; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
  .row-sum{ display:flex; justify-content:space-between; align-items:center; padding:10px 0; font-size:14px; }
  .row-sum + .row-sum{ border-top:1px dashed var(--border); margin-top:8px; padding-top:16px; }
  .label{ color:var(--muted); font-weight:500; }
  .total{ font-size:20px; font-weight:800; color:var(--ink); padding:16px 0 8px; border-top:2px solid var(--accent); margin-top:12px; }

  /* Notes - Enhanced styling */
  .notes{ margin:32px 0; padding:24px; border:1px solid var(--border); border-radius:12px; background:#f8fafc; }
  .notes h4{ margin:0 0 12px; font-size:13px; letter-spacing:.6px; text-transform:uppercase; color:var(--ink); font-weight:700; }
  .notes div{ line-height:1.6; font-size:14px; }

  /* Footer - Better spacing */
  .footer{ margin-top:40px; padding-top:24px; border-top:1px solid var(--border); text-align:center; font-size:12px; color:var(--muted); line-height:1.5; }
`;

