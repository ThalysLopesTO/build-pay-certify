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
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 18;

  let currentY = margin;

  // 1. Header moderno com logo + card de resumo
  currentY = await addHeaderSection(pdf, quote, companySettings, logoUrl, currentY, pageWidth, margin);

  // 2. Recipient
  currentY = addRecipientSection(pdf, quote, currentY, margin, pageWidth);

  // 3. Project details
  currentY = addProjectDetailsSection(pdf, quote, currentY, margin, pageWidth);

  // 4. Tabela de itens (autoTable cuida da paginação)
  currentY = addLineItemsTable(pdf, lineItems, currentY, margin, pageWidth);

  // 5. Totais (com cartão à direita)
  currentY = addTotalsSection(pdf, quote, currentY, pageWidth, pageHeight, margin);

  // 6. Notas
  if (quote.notes) {
    currentY = addNotesSection(pdf, quote.notes, currentY, pageWidth, margin, pageHeight);
  }

  // 7. Rodapé em todas as páginas
  addFooterToAllPages(pdf, pageWidth, pageHeight);

  const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, "")}.pdf`;
  pdf.save(filename);
};

// ================= HEADER =================

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
  const cardWidth = 80;
  const cardX = pageWidth - margin - cardWidth;
  const cardY = headerTop;
  const cardHeight = 42;

  // Card escuro à direita
  pdf.setFillColor(28, 35, 47); // dark navy/graphite
  pdf.setDrawColor(28, 35, 47);
  pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, "FD");

  // Texto dentro do card
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("QUOTE", cardX + 7, cardY + 8);

  pdf.setFontSize(13);
  pdf.text(`#${quote.quote_number}`, cardX + cardWidth / 2, cardY + 17, {
    align: "center",
  });

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

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const infoY = cardY + 23;
  pdf.text("Quote Date", cardX + 7, infoY);
  pdf.text("Total", cardX + cardWidth - 7, infoY, { align: "right" });

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text(quoteDate, cardX + 7, infoY + 5);
  pdf.text(formattedTotal, cardX + cardWidth - 7, infoY + 5, {
    align: "right",
  });

  // Status pill
  const { statusLabel, statusColor } = getStatusStyles(quote.status);
  const pillWidth = 26;
  const pillHeight = 6;
  const pillX = cardX + 7;
  const pillY = cardY + cardHeight - 9;

  pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.roundedRect(pillX, pillY, pillWidth, pillHeight, 3, 3, "F");
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text(statusLabel.toUpperCase(), pillX + pillWidth / 2, pillY + 4, {
    align: "center",
  });

  // Logo à esquerda
  let leftBottomY = headerTop;

  if (logoUrl) {
    try {
      const logoBase64 = await fetchLogoAsBase64(logoUrl);
      pdf.addImage(logoBase64, "PNG", margin, headerTop, 32, 18);
      leftBottomY = headerTop + 18;
    } catch (error) {
      console.error("Failed to load logo:", error);
    }
  }

  // Company info
  let y = leftBottomY + 6;
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(settings?.company_name || "Company Name", margin, y);
  y += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  if (settings?.company_address) {
    const addressLines = pdf.splitTextToSize(settings.company_address, 90);
    pdf.text(addressLines, margin, y);
    y += addressLines.length * 4.5 + 1;
  }

  if (settings?.company_phone) {
    pdf.text(`Phone: ${settings.company_phone}`, margin, y);
    y += 4.5;
  }
  if (settings?.company_email) {
    pdf.text(`Email: ${settings.company_email}`, margin, y);
    y += 4.5;
  }

  leftBottomY = y;

  // Linha divisória
  const headerBottom = Math.max(leftBottomY, cardY + cardHeight) + 6;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(margin, headerBottom, pageWidth - margin, headerBottom);

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  return headerBottom + 8;
};

const getStatusStyles = (status: string): { statusLabel: string; statusColor: [number, number, number] } => {
  const normalized = status?.toLowerCase?.() || "";

  if (normalized.includes("approved") || normalized.includes("accepted")) {
    return { statusLabel: "Approved", statusColor: [34, 197, 94] }; // green
  }
  if (normalized.includes("sent")) {
    return { statusLabel: "Sent", statusColor: [59, 130, 246] }; // blue
  }
  if (normalized.includes("draft")) {
    return { statusLabel: "Draft", statusColor: [148, 163, 184] }; // grey
  }
  if (normalized.includes("rejected") || normalized.includes("declined")) {
    return { statusLabel: "Declined", statusColor: [239, 68, 68] }; // red
  }

  return { statusLabel: status || "Open", statusColor: [99, 102, 241] }; // indigo
};

// ============= RECIPIENT =============

const addRecipientSection = (pdf: jsPDF, quote: Quote, startY: number, margin: number, pageWidth: number): number => {
  let y = startY;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("RECIPIENT", margin, y);
  y += 6;

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFontSize(10);

  // Nome
  pdf.text(quote.client_name, margin, y);
  y += 5;

  pdf.setFont("helvetica", "normal");

  if (quote.client_company) {
    pdf.text(quote.client_company, margin, y);
    y += 4.5;
  }

  if (quote.client_address) {
    const addressLines = pdf.splitTextToSize(quote.client_address, 90);
    pdf.text(addressLines, margin, y);
    y += addressLines.length * 4.5;
  }

  if (quote.client_email) {
    pdf.text(quote.client_email, margin, y);
    y += 4.5;
  }

  if (quote.client_phone) {
    pdf.text(`Phone: ${quote.client_phone}`, margin, y);
    y += 4.5;
  }

  return y + 8;
};

// ============= PROJECT DETAILS =============

const addProjectDetailsSection = (
  pdf: jsPDF,
  quote: Quote,
  startY: number,
  margin: number,
  pageWidth: number,
): number => {
  let y = startY;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("PROJECT DETAILS", margin, y);
  y += 6;

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  const projectLines = pdf.splitTextToSize(`Project: ${quote.project_name}`, pageWidth - 2 * margin);
  pdf.text(projectLines, margin, y);
  y += projectLines.length * 4.5 + 1;

  const quoteDate = new Date(quote.quote_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  pdf.text(`Quote Date: ${quoteDate}`, margin, y);
  y += 4.5;

  if (quote.expiry_date) {
    const expiryDate = new Date(quote.expiry_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    pdf.text(`Valid Until: ${expiryDate}`, margin, y);
    y += 4.5;
  }

  pdf.text(`Status: ${quote.status.toUpperCase()}`, margin, y);
  y += 10;

  return y;
};

// ============= TABLE =============

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
      fillColor: [37, 99, 235], // azul mais elegante
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 4,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      minCellHeight: 9,
      textColor: [55, 65, 81],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 90, halign: "left" },
      1: { cellWidth: 55, halign: "left" },
      2: { cellWidth: 35, halign: "right" },
    },
  });

  return pdf.lastAutoTable.finalY + 10;
};

// ============= TOTALS =============

const addTotalsSection = (
  pdf: jsPDF,
  quote: Quote,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
): number => {
  // Se estiver muito perto do fim da página, joga para a próxima
  if (startY + 45 > pageHeight - margin) {
    pdf.addPage();
    startY = margin;
  }

  const boxWidth = 80;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = startY - 4;
  const boxHeight = 40;

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, "FD");

  const labelX = boxX + 8;
  const valueX = boxX + boxWidth - 8;
  let y = boxY + 12;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(55, 65, 81);

  // Subtotal
  pdf.text("Subtotal", labelX, y);
  pdf.text(formatCurrency(quote.subtotal), valueX, y, { align: "right" });
  y += 6;

  // Discount
  if (quote.discount > 0) {
    pdf.text("Discount", labelX, y);
    pdf.text(`-${formatCurrency(quote.discount)}`, valueX, y, {
      align: "right",
    });
    y += 6;
  }

  // Tax
  const taxAmount = (quote.subtotal - (quote.discount || 0)) * (quote.tax / 100);
  pdf.text(`Tax (${quote.tax}%)`, labelX, y);
  pdf.text(formatCurrency(taxAmount), valueX, y, { align: "right" });
  y += 7;

  // Linha e TOTAL
  pdf.setDrawColor(209, 213, 219);
  pdf.setLineWidth(0.4);
  pdf.line(labelX, y, valueX, y);

  y += 6;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(17, 24, 39);
  pdf.text("TOTAL", labelX, y);
  pdf.text(formatCurrency(quote.total_amount), valueX, y, { align: "right" });

  return boxY + boxHeight + 10;
};

// ============= NOTES =============

const addNotesSection = (
  pdf: jsPDF,
  notes: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
): number => {
  if (startY + 30 > pageHeight - margin) {
    pdf.addPage();
    startY = margin;
  }

  let y = startY;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("NOTES", margin, y);
  y += 6;

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const maxWidth = pageWidth - 2 * margin - 10;
  const splitNotes = pdf.splitTextToSize(notes, maxWidth);

  const notesHeight = splitNotes.length * 4.5 + 10;

  // Caixa com fundo suave
  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(margin, y - 4, pageWidth - 2 * margin, notesHeight, 3, 3, "FD");

  pdf.setTextColor(55, 65, 81);
  pdf.text(splitNotes, margin + 5, y + 2);

  return y + notesHeight + 10;
};

// ============= FOOTER =============

const addFooterToAllPages = (pdf: ExtendedJsPDF, pageWidth: number, pageHeight: number) => {
  const pageCount = pdf.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(148, 163, 184);

    pdf.text("Thank you for your business!", pageWidth / 2, pageHeight - 14, { align: "center" });

    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  pdf.setTextColor(0, 0, 0);
};

// ============= BLOB (EMAIL) =============

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

  addFooterToAllPages(pdf, pageWidth, pageHeight);

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
