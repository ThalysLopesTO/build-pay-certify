import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quote, QuoteLineItem } from "@/hooks/quotes";
import { CompanySettings } from "@/hooks/useCompanySettings";
import { fetchLogoAsBase64 } from "@/utils/logoUtils";

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generateQuotePDF = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null,
) => {
  const pdf = new jsPDF("p", "mm", "a4") as ExtendedJsPDF;
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;

  let currentY = margin;

  // 1. Header minimalista
  currentY = await addHeaderSection(pdf, quote, companySettings, logoUrl, currentY, pageWidth, margin);

  // 2. Recipient
  currentY = addRecipientSection(pdf, quote, currentY, margin, pageWidth);

  // 3. Project details
  currentY = addProjectDetailsSection(pdf, quote, currentY, margin, pageWidth);

  // 4. Tabela
  currentY = addLineItemsTable(pdf, lineItems, currentY, margin, pageWidth);

  // 5. Totais
  currentY = addTotalsSection(pdf, quote, currentY, pageWidth, pageHeight, margin);

  // 6. Notas
  if (quote.notes) {
    currentY = addNotesSection(pdf, quote.notes, currentY, pageWidth, margin, pageHeight);
  }

  // 7. Rodapé com dados da empresa
  addFooterToAllPages(pdf, pageWidth, pageHeight, companySettings || null);

  const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, "")}.pdf`;
  pdf.save(filename);
};

// ============== HEADER (MINIMAL) ==============

const addHeaderSection = async (
  pdf: jsPDF,
  quote: Quote,
  settings: CompanySettings | null | undefined,
  logoUrl: string | null | undefined,
  startY: number,
  pageWidth: number,
  margin: number,
): Promise<number> => {
  const headerTop = startY;
  const rightX = pageWidth - margin;

  // Logo à esquerda (tamanho ajustado)
  let leftBottomY = headerTop;

  if (logoUrl) {
    try {
      const logoBase64 = await fetchLogoAsBase64(logoUrl);
      // Mais discreto: 25 x 13 mm
      pdf.addImage(logoBase64, "PNG", margin, headerTop, 25, 13);
      leftBottomY = headerTop + 13;
    } catch (error) {
      console.error("Failed to load logo:", error);
    }
  }

  // Company info
  let y = leftBottomY + 4;
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(settings?.company_name || "Company Name", margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  if (settings?.company_address) {
    const addressLines = pdf.splitTextToSize(settings.company_address, 90);
    pdf.text(addressLines, margin, y);
    y += addressLines.length * 4.2 + 1;
  }

  if (settings?.company_phone) {
    pdf.text(`Phone: ${settings.company_phone}`, margin, y);
    y += 4.2;
  }
  if (settings?.company_email) {
    pdf.text(`Email: ${settings.company_email}`, margin, y);
    y += 4.2;
  }

  leftBottomY = y;

  // Info da Quote à direita (sem box, só texto)
  const sentDate = quote.sent_date || quote.quote_date;
  const quoteDate = new Date(sentDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(quote.total_amount);

  let rightY = headerTop + 2;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("QUOTE", rightX, rightY, { align: "right" });
  rightY += 6;

  pdf.setFontSize(13);
  pdf.text(`#${quote.quote_number}`, rightX, rightY, { align: "right" });
  rightY += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.text("Quote Date", rightX, rightY, { align: "right" });
  rightY += 4;
  pdf.setTextColor(17, 24, 39);
  pdf.text(quoteDate, rightX, rightY, { align: "right" });
  rightY += 6;

  pdf.setTextColor(107, 114, 128);
  pdf.text("Total", rightX, rightY, { align: "right" });
  rightY += 4;
  pdf.setTextColor(17, 24, 39);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(formattedTotal, rightX, rightY, { align: "right" });

  const headerBottom = Math.max(leftBottomY, rightY) + 6;

  // Linha horizontal suave
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.4);
  pdf.line(margin, headerBottom, pageWidth - margin, headerBottom);

  pdf.setTextColor(0, 0, 0);
  return headerBottom + 6;
};

// ============== RECIPIENT ==============

const addRecipientSection = (pdf: jsPDF, quote: Quote, startY: number, margin: number, pageWidth: number): number => {
  let y = startY;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("RECIPIENT", margin, y);
  y += 4;

  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(31, 41, 55);

  pdf.text(quote.client_name, margin, y);
  y += 4.5;

  if (quote.client_company) {
    pdf.text(quote.client_company, margin, y);
    y += 4.5;
  }

  if (quote.client_address) {
    const addressLines = pdf.splitTextToSize(quote.client_address, 90);
    pdf.text(addressLines, margin, y);
    y += addressLines.length * 4.2;
  }

  if (quote.client_email) {
    pdf.text(quote.client_email, margin, y);
    y += 4.2;
  }

  if (quote.client_phone) {
    pdf.text(`Phone: ${quote.client_phone}`, margin, y);
    y += 4.2;
  }

  return y + 8;
};

// ============== PROJECT DETAILS ==============

const addProjectDetailsSection = (
  pdf: jsPDF,
  quote: Quote,
  startY: number,
  margin: number,
  pageWidth: number,
): number => {
  let y = startY;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("PROJECT DETAILS", margin, y);
  y += 4;

  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(31, 41, 55);

  const projectLines = pdf.splitTextToSize(`Project: ${quote.project_name}`, pageWidth - 2 * margin);
  pdf.text(projectLines, margin, y);
  y += projectLines.length * 4.2 + 1;

  const quoteDate = new Date(quote.quote_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  pdf.text(`Quote Date: ${quoteDate}`, margin, y);
  y += 4.2;

  if (quote.expiry_date) {
    const expiryDate = new Date(quote.expiry_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    pdf.text(`Valid Until: ${expiryDate}`, margin, y);
    y += 4.2;
  }

  pdf.text(`Status: ${quote.status.toUpperCase()}`, margin, y);
  y += 8;

  return y;
};

// ============== TABLE ==============

const addLineItemsTable = (
  pdf: ExtendedJsPDF,
  lineItems: QuoteLineItem[],
  startY: number,
  margin: number,
  pageWidth: number,
): number => {
  const tableData = lineItems.map((item) => {
    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(item.amount);

    return [item.description, item.vendor || "-", formattedTotal];
  });

  autoTable(pdf, {
    startY,
    head: [["Description", "Vendor", "Total"]],
    body: tableData,
    theme: "grid",
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [248, 250, 252], // cinza muito claro
      textColor: [15, 23, 42],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 4,
      lineColor: [209, 213, 219],
      lineWidth: 0.3,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [229, 231, 235],
      lineWidth: 0.25,
      minCellHeight: 8.5,
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 90, halign: "left" },
      1: { cellWidth: 55, halign: "left" },
      2: { cellWidth: 35, halign: "right" },
    },
  });

  return pdf.lastAutoTable.finalY + 10;
};

// ============== TOTALS (MINIMAL) ==============

const addTotalsSection = (
  pdf: jsPDF,
  quote: Quote,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
): number => {
  if (startY + 30 > pageHeight - margin) {
    pdf.addPage();
    startY = margin;
  }

  const labelX = pageWidth - margin - 55;
  const valueX = pageWidth - margin;
  let y = startY;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  // Linha separadora
  pdf.setDrawColor(209, 213, 219);
  pdf.setLineWidth(0.4);
  pdf.line(labelX - 5, y, valueX, y);
  y += 6;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(75, 85, 99);

  pdf.text("Subtotal", labelX, y, { align: "right" });
  pdf.text(formatCurrency(quote.subtotal), valueX, y, { align: "right" });
  y += 5;

  if (quote.discount > 0) {
    pdf.text("Discount", labelX, y, { align: "right" });
    pdf.text(`-${formatCurrency(quote.discount)}`, valueX, y, {
      align: "right",
    });
    y += 5;
  }

  const taxAmount = (quote.subtotal - (quote.discount || 0)) * (quote.tax / 100);
  pdf.text(`Tax (${quote.tax}%)`, labelX, y, { align: "right" });
  pdf.text(formatCurrency(taxAmount), valueX, y, { align: "right" });
  y += 7;

  // TOTAL
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(17, 24, 39);
  pdf.text("TOTAL", labelX, y, { align: "right" });
  pdf.text(formatCurrency(quote.total_amount), valueX, y, { align: "right" });
  y += 8;

  return y;
};

// ============== NOTES (MINIMAL) ==============

const addNotesSection = (
  pdf: jsPDF,
  notes: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
): number => {
  if (startY + 25 > pageHeight - margin) {
    pdf.addPage();
    startY = margin;
  }

  let y = startY;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("NOTES", margin, y);
  y += 4;

  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(55, 65, 81);

  const maxWidth = pageWidth - 2 * margin;
  const splitNotes = pdf.splitTextToSize(notes, maxWidth);

  pdf.text(splitNotes, margin, y);

  const notesHeight = splitNotes.length * 4.2;
  return y + notesHeight + 8;
};

// ============== FOOTER (COM CONTATO) ==============

const addFooterToAllPages = (
  pdf: ExtendedJsPDF,
  pageWidth: number,
  pageHeight: number,
  settings: CompanySettings | null,
) => {
  const pageCount = pdf.getNumberOfPages();
  const margin = 18;

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);

    let contactY = pageHeight - 14;

    // Linha com telefone e email
    if (settings?.company_phone || settings?.company_email) {
      const parts: string[] = [];
      if (settings.company_phone) parts.push(`Phone: ${settings.company_phone}`);
      if (settings.company_email) parts.push(`Email: ${settings.company_email}`);
      const contactLine = parts.join("  •  ");
      pdf.text(contactLine, pageWidth / 2, contactY, { align: "center" });
      contactY += 4;
    }

    // Linha com endereço
    if (settings?.company_address) {
      const addressLines = pdf.splitTextToSize(settings.company_address, pageWidth - 2 * margin);
      pdf.text(addressLines as string[], pageWidth / 2, contactY, {
        align: "center",
      });
      contactY += addressLines.length * 3.2;
    }

    // Número da página
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 4, { align: "center" });
  }

  pdf.setTextColor(0, 0, 0);
};

// ============== BLOB (EMAIL) ==============

export const generateQuotePDFBlob = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null,
): Promise<{ blob: Blob; filename: string }> => {
  const pdf = new jsPDF("p", "mm", "a4") as ExtendedJsPDF;
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;

  let currentY = margin;

  currentY = await addHeaderSection(pdf, quote, companySettings, logoUrl, currentY, pageWidth, margin);
  currentY = addRecipientSection(pdf, quote, currentY, margin, pageWidth);
  currentY = addProjectDetailsSection(pdf, quote, currentY, margin, pageWidth);
  currentY = addLineItemsTable(pdf, lineItems, currentY, margin, pageWidth);
  currentY = addTotalsSection(pdf, quote, currentY, pageWidth, pageHeight, margin);

  if (quote.notes) {
    currentY = addNotesSection(pdf, quote.notes, currentY, pageWidth, margin, pageHeight);
  }

  addFooterToAllPages(pdf, pageWidth, pageHeight, companySettings || null);

  const blob = pdf.output("blob");
  const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, "")}.pdf`;

  return { blob, filename };
};

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
