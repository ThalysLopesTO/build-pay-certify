// pdfGeneratorForEmail.ts
// ------------------------------------------------------------
// HTML → canvas → PDF generator for emailing/printing Invoices & Quotes
// Professional A4 layout, print-safe colors, multi-page support.
// ------------------------------------------------------------

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Invoice } from "@/components/admin/types/invoice";
import { Quote, QuoteLineItem } from "@/hooks/quotes";
import { CompanySettings } from "@/hooks/useCompanySettings";

/* ===========================================================
   Public API
   =========================================================== */

export const generateInvoicePDFBlob = async (
  invoice: Invoice,
  companySettings?: CompanySettings | null,
  logoUrl?: string | null,
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const host = prepareOffscreen();
    host.innerHTML = await generateInvoiceHTML(invoice, companySettings, logoUrl);
    document.body.appendChild(host);

    const canvas = await html2canvas(host, {
      scale: 2, // retina-quality (prints sharper)
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      windowWidth: A4_CANVAS_WIDTH, // avoid reflow differences
    });

    document.body.removeChild(host);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    addCanvasToPdfMultipage(canvas, pdf);

    const status = (invoice.status ?? "DRAFT").toUpperCase();
    if (status !== "PAID") addWatermark(pdf, status);

    const blob = pdf.output("blob");
    const filename = `Invoice_${invoice.invoice_number || invoice.id}.pdf`;
    return { blob, filename };
  } catch (err) {
    console.error("Error generating invoice PDF blob:", err);
    throw err;
  }
};

export const generateQuotePDFBlob = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null,
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const host = prepareOffscreen();
    host.innerHTML = await generateQuoteHTML(quote, lineItems, companySettings, logoUrl);
    document.body.appendChild(host);

    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      windowWidth: A4_CANVAS_WIDTH,
    });

    document.body.removeChild(host);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    addCanvasToPdfMultipage(canvas, pdf);

    const status = (quote.status ?? "DRAFT").toUpperCase();
    if (status !== "ACCEPTED") addWatermark(pdf, status);

    const blob = pdf.output("blob");
    const filename = `Quote_${quote.quote_number}.pdf`;
    return { blob, filename };
  } catch (err) {
    console.error("Error generating quote PDF blob:", err);
    throw err;
  }
};

// Convert Blob → base64 (no data: prefix)
export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1] ?? "");
      } else reject(new Error("Failed to convert blob to base64"));
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
  logoUrl?: string | null,
): Promise<string> => {
  const currency = companySettings?.default_currency || companySettings?.currency || "CAD";

  const lineItems = (invoice.invoice_line_items ?? []) as Array<{
    description?: string;
    amount?: number;
    notes?: string;
  }>;

  const subtotal = invoice.subtotal ?? lineItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const taxPct = Number(invoice.tax) || 0;
  const taxAmount = subtotal * (taxPct / 100);
  const total = invoice.total_amount ?? subtotal + taxAmount;

  const issued = invoice.issue_date || (invoice as any).created_at || new Date();

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="paper" role="document" aria-label="Invoice">
        <!-- Header -->
        <header class="header" aria-label="Header">
          ${renderBrand(logoUrl, companySettings?.company_name ?? "Your Company", companySettings)}
          <div class="meta">
            <h1 class="title">INVOICE</h1>
            <div class="kv">Invoice # <b>${sanitize(invoice.invoice_number || invoice.id)}</b></div>
            <div class="kv">Date <b>${formatDate(issued)}</b></div>
            <div class="kv">Due Date <b>${formatDate(invoice.due_date)}</b></div>
            <span class="${statusClass(invoice.status)}">${(invoice.status ?? "draft").toUpperCase()}</span>
          </div>
        </header>

        <!-- Parties -->
        <section class="grid-2">
          <div class="card">
            <h4>Bill To</h4>
            <div><b>${sanitize(invoice.client_company || (invoice as any).client_name || "Client")}</b></div>
            ${invoice.client_email ? `<div class="muted">${sanitize(invoice.client_email)}</div>` : ""}
            ${invoice.project_name ? `<div class="muted"><b>Project:</b> ${sanitize(invoice.project_name)}</div>` : ""}
          </div>
          <div class="card">
            <h4>Invoice Details</h4>
            <div class="muted">Reference: ${sanitize(invoice.invoice_number || invoice.id)}</div>
            <div class="muted">Terms: ${sanitize(companySettings?.default_terms ?? "Net 30")}</div>
            ${invoice.reference ? `<div class="muted">PO/Ref: ${sanitize(invoice.reference)}</div>` : ""}
          </div>
        </section>

        <!-- Items -->
        <table role="table" aria-label="Invoice items">
          <thead>
            <tr>
              <th>Description</th>
              <th class="ta-r">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              lineItems.length
                ? lineItems
                    .map(
                      (it) => `
                    <tr>
                      <td>
                        <div><b>${sanitize(it.description) || "Line item"}</b></div>
                        ${it.notes ? `<div class="desc">${sanitize(it.notes)}</div>` : ""}
                      </td>
                      <td class="ta-r">${formatCurrency(Number(it.amount) || 0, currency)}</td>
                    </tr>
                  `,
                    )
                    .join("")
                : `
                  <tr>
                    <td><div><b>No items</b></div></td>
                    <td class="ta-r">${formatCurrency(0, currency)}</td>
                  </tr>
                `
            }
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
            ? `<section class="notes">
                 <h4>Notes</h4>
                 <div>${sanitize(invoice.notes)}</div>
               </section>`
            : ""
        }

        <!-- Payment Details -->
        ${renderPaymentDetails(companySettings)}

        <!-- Footer -->
        <footer class="footer">
          Thank you for your business.${
            companySettings?.company_name
              ? ` &nbsp;© ${new Date().getFullYear()} ${sanitize(companySettings.company_name)}`
              : ""
          }
        </footer>
      </div>
    </body>
  </html>
  `;
};

const generateQuoteHTML = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null,
): Promise<string> => {
  const currency = companySettings?.default_currency || companySettings?.currency || "CAD";

  const subtotal = quote.subtotal ?? lineItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

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
      <div class="paper" role="document" aria-label="Quote">
        <header class="header">
          ${renderBrand(logoUrl, companySettings?.company_name ?? "Your Company", companySettings)}
          <div class="meta">
            <h1 class="title">QUOTE</h1>
            <div class="kv">Quote # <b>${sanitize(quote.quote_number)}</b></div>
            <div class="kv">Date <b>${formatDate(quote.created_at)}</b></div>
            <div class="kv">Valid Until <b>${formatDate(quote.expiry_date)}</b></div>
            <span class="${statusClass(quote.status)}">${(quote.status ?? "draft").toUpperCase()}</span>
          </div>
        </header>

        <section class="grid-2">
          <div class="card">
            <h4>Quote For</h4>
            <div><b>${sanitize(quote.client_name) || sanitize(quote.client_company) || "Client"}</b></div>
            ${quote.client_company ? `<div class="muted">${sanitize(quote.client_company)}</div>` : ""}
            ${quote.client_email ? `<div class="muted">${sanitize(quote.client_email)}</div>` : ""}
            ${quote.project_name ? `<div class="muted"><b>Project:</b> ${sanitize(quote.project_name)}</div>` : ""}
          </div>
          <div class="card">
            <h4>Quote Details</h4>
            <div class="muted">Reference: ${sanitize(quote.quote_number)}</div>
            <div class="muted">Valid Until: ${formatDate(quote.expiry_date)}</div>
          </div>
        </section>

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
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="summary-wrap">
          <div class="summary">
            <div class="row-sum"><span class="label">Subtotal</span><span>${formatCurrency(subtotal, currency)}</span></div>
            ${discountPct ? `<div class="row-sum"><span class="label">Discount (${discountPct}%)</span><span>-${formatCurrency(discount, currency)}</span></div>` : ""}
            ${taxPct ? `<div class="row-sum"><span class="label">Tax (${taxPct}%)</span><span>${formatCurrency(taxAmount, currency)}</span></div>` : ""}
            <div class="row-sum total"><span>Total</span><span>${formatCurrency(total, currency)}</span></div>
          </div>
        </div>

        ${quote.notes ? `<section class="notes"><h4>Notes</h4><div>${sanitize(quote.notes)}</div></section>` : ""}

        <footer class="footer">
          Thank you for considering us.${
            companySettings?.company_name
              ? ` &nbsp;© ${new Date().getFullYear()} ${sanitize(companySettings.company_name)}`
              : ""
          }
        </footer>
      </div>
    </body>
  </html>
  `;
};

/* ===========================================================
   Helpers (layout, math, safety, PDF placement)
   =========================================================== */

// A4 @ 96 DPI canvas area (210 × 297 mm) with inner page padding
const A4_CANVAS_WIDTH = 794; // 210mm at 96dpi
const A4_CANVAS_HEIGHT = 1123; // 297mm at 96dpi

const prepareOffscreen = () => {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = "-99999px";
  el.style.top = "-99999px";
  el.style.width = `${A4_CANVAS_WIDTH}px`;
  el.style.background = "white";
  // 12mm ≈ 45px padding yields nice print margins
  el.style.padding = "45px";
  el.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans"';
  return el;
};

// Add one or more PDF pages by slicing the tall canvas
const addCanvasToPdfMultipage = (canvas: HTMLCanvasElement, pdf: jsPDF) => {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const imgW = pageW; // fill page width
  const imgH = (canvas.height * imgW) / canvas.width;

  const pageCanvas = document.createElement("canvas");
  const pageCtx = pageCanvas.getContext("2d")!;
  const ratio = pageW / canvas.width;
  const pagePxHeight = Math.floor(pageH / ratio);

  pageCanvas.width = canvas.width;
  pageCanvas.height = pagePxHeight;

  let renderedHeight = 0;
  let pageIndex = 0;

  while (renderedHeight < canvas.height) {
    // Clear and draw slice
    pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
    const sliceHeight = Math.min(pagePxHeight, canvas.height - renderedHeight);
    pageCanvas.height = sliceHeight; // adjust last page
    pageCtx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, pageCanvas.width, sliceHeight);

    const imgData = pageCanvas.toDataURL("image/png");
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, imgW, (sliceHeight * imgW) / canvas.width);

    renderedHeight += sliceHeight;
    pageIndex++;
  }

  // Page numbers (optional)
  const totalPages = pdf.getNumberOfPages();
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.text(`Page ${i} of ${totalPages}`, pageW - 20, pageH - 8, { align: "right" });
  }
};

// Watermark helper
const addWatermark = (pdf: jsPDF, text: string) => {
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(54);
  pdf.setTextColor(200, 200, 200);
  pdf.text(text, pdfW / 2, pdfH / 2, { align: "center", angle: 45 });
};

// Sanitizer
const sanitize = (v: any): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Currency/date helpers
const formatCurrency = (amount: number, currency = "CAD") =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(amount ?? 0);

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
};

// Brand block with company information
const renderBrand = (logoUrl?: string | null, companyName?: string | null, cs?: any) => {
  if (logoUrl) {
    return `
      <div class="brand">
        <img class="brand-logo" src="${logoUrl}" alt="${sanitize(companyName) || "Company"} logo" />
        <div class="brand-text">
          <div class="brand-name">${sanitize(companyName) || ""}</div>
          ${cs?.company_address ? `<div class="brand-address">${sanitize(cs.company_address)}</div>` : ""}
          ${cs?.company_phone ? `<div class="brand-contact">${sanitize(cs.company_phone)}</div>` : ""}
          ${cs?.company_email ? `<div class="brand-contact">${sanitize(cs.company_email)}</div>` : ""}
        </div>
      </div>`;
  }
  return `
    <div class="brand brand--textonly">
      <div class="brand-mark">◆</div>
      <div class="brand-text">
        <div class="brand-name">${sanitize(companyName) || ""}</div>
        ${cs?.company_address ? `<div class="brand-address">${sanitize(cs.company_address)}</div>` : ""}
        ${cs?.company_phone ? `<div class="brand-contact">${sanitize(cs.company_phone)}</div>` : ""}
        ${cs?.company_email ? `<div class="brand-contact">${sanitize(cs.company_email)}</div>` : ""}
      </div>
    </div>`;
};

const renderPaymentDetails = (cs?: any) => {
  if (!cs) return "";
  const rows: string[] = [];
  if (cs?.payment_instructions) rows.push(`<div>${sanitize(cs.payment_instructions)}</div>`);
  if (cs?.etransfer_email) rows.push(`<div><b>E-Transfer:</b> ${sanitize(cs.etransfer_email)}</div>`);
  if (cs?.bank_name || cs?.bank_account) {
    rows.push(
      `<div><b>Bank:</b> ${sanitize(cs.bank_name || "")} &nbsp; <b>Account:</b> ${sanitize(cs.bank_account || "")}</div>`,
    );
  }
  if (!rows.length) return "";
  return `
    <section class="notes">
      <h4>Payment Details</h4>
      ${rows.join("\n")}
    </section>
  `;
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

/* ===========================================================
   Shared CSS (kept inline for html2canvas reliability)
   =========================================================== */
const baseStyles = `
  :root{
    --ink:#0b1220;     /* headings */
    --text:#1f2937;    /* body */
    --muted:#5b6777;   /* labels */
    --border:#e3e8ef;  /* outlines */
    --zebra:#f8fafc;   /* row alt */
    --header:#f1f5f9;  /* table head bg */
    --paid:#16a34a;    /* green */
    --warn:#f59e0b;    /* amber */
    --bad:#ef4444;     /* red */
    --accent:#2563eb;  /* blue */
  }
  *{ box-sizing:border-box; }
  html, body{ margin:0; padding:0; color:var(--text); font:14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans"; }
  .paper{ width:${A4_CANVAS_WIDTH}px; background:#fff; }

  /* Header */
  .header{ display:flex; justify-content:space-between; align-items:flex-start; gap:40px; padding:8px 0 24px; border-bottom:2px solid var(--border); margin-bottom:24px; }
  .brand{ display:flex; align-items:center; gap:16px; }
  .brand--textonly .brand-mark{ width:56px; height:56px; display:grid; place-items:center; background:var(--accent); color:#fff; border-radius:12px; font-weight:800; font-size:18px; }
  .brand-logo{ width:120px; height:60px; object-fit:contain; }
  .brand-name{ font-weight:800; font-size:20px; color:var(--ink); letter-spacing:.3px; line-height:1.2; margin-bottom:4px; }
  .brand-address, .brand-contact{ font-size:12.5px; color:var(--muted); line-height:1.35; }
  .meta{ text-align:right; min-width:280px; }
  .title{ font-size:34px; font-weight:900; margin:0 0 10px; letter-spacing:.5px; color:var(--accent); text-transform:uppercase; }
  .kv{ font-size:13.5px; color:var(--muted); margin-bottom:6px; }
  .kv b{ color:var(--text); font-weight:700; }

  /* Status pill */
  .status{ display:inline-block; margin-top:12px; padding:7px 14px; border-radius:999px; color:#fff; font-size:11.5px; font-weight:800; letter-spacing:.45px; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
  .status--paid{ background:linear-gradient(135deg, var(--paid), #22c55e); }
  .status--pending{ background:linear-gradient(135deg, var(--warn), #fbbf24); }
  .status--overdue{ background:linear-gradient(135deg, var(--bad), #f87171); }
  .status--draft{ background:linear-gradient(135deg, #94a3b8, #cbd5e1); }

  /* Cards */
  .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:24px; margin:22px 0 14px; }
  .card{ border:1px solid var(--border); border-radius:12px; padding:18px 20px; background:#fff; }
  .card h4{ margin:0 0 10px; color:var(--ink); font-size:12.5px; text-transform:uppercase; letter-spacing:.55px; font-weight:800; }
  .muted{ color:var(--muted); font-size:12.5px; }

  /* Table */
  table{ width:100%; border-collapse:separate; border-spacing:0; margin:20px 0 8px; border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  thead th{
    text-align:left; padding:14px 18px; font-size:12px; text-transform:uppercase; letter-spacing:.55px; color:var(--ink); font-weight:800;
    background:linear-gradient(135deg, var(--header), #f8fafc); border-bottom:2px solid var(--border);
  }
  thead th:first-child{ width:64%; }
  thead th:last-child{ width:36%; text-align:right; }
  tbody td{ padding:18px; border-bottom:1px solid var(--border); vertical-align:top; line-height:1.5; }
  tbody td:first-child{ width:64%; }
  tbody td:last-child{ width:36%; text-align:right; font-weight:600; }
  tbody tr:nth-child(even) td{ background:var(--zebra); }
  tbody tr:last-child td{ border-bottom:none; }
  .desc{ font-size:12.5px; color:var(--muted); margin-top:6px; line-height:1.4; }

  /* Summary */
  .summary-wrap{ display:flex; justify-content:flex-end; margin:18px 0 10px; }
  .summary{ width:280px; border:1px solid var(--border); border-radius:12px; padding:18px 20px; background:#fff; }
  .row-sum{ display:flex; justify-content:space-between; align-items:center; padding:8px 0; font-size:13.5px; }
  .row-sum + .row-sum{ border-top:1px dashed var(--border); margin-top:6px; padding-top:12px; }
  .label{ color:var(--muted); font-weight:500; }
  .total{ font-size:18px; font-weight:900; color:var(--ink); padding:14px 0 6px; border-top:2px solid var(--accent); margin-top:8px; }

  /* Notes / Payment */
  .notes{ margin:14px 0; padding:16px 18px; border:1px solid var(--border); border-radius:12px; background:#f8fafc; }
  .notes h4{ margin:0 0 8px; font-size:12.5px; letter-spacing:.55px; text-transform:uppercase; color:var(--ink); font-weight:800; }
  .notes div{ line-height:1.55; font-size:13.5px; }

  /* Footer */
  .footer{ margin-top:24px; padding-top:16px; border-top:1px solid var(--border); text-align:center; font-size:11.5px; color:var(--muted); line-height:1.4; }
`;
