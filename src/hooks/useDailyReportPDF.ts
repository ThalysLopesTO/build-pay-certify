// utils/pdf/useDailyReportPDF.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: { finalY: number };
}

// ---------- Config ----------
const A4 = { w: 595.28, h: 841.89 };              // pt
const MARGIN = 40;
const HEADER_H = 86;                               // taller to fit proper logo
const FOOTER_H = 36;
const CONTENT_TOP = MARGIN + HEADER_H + 8;

const PRIMARY = "#111111";
const ACCENT = "#2563eb";                          // StackBuild blue
const MUTED = "#666666";
const CARD_BG = "#f6f7fb";
const BORDER = "#E3E5EB";

// Logo target bounds (keeps aspect ratio)
const LOGO_MAX_W = 130;
const LOGO_MAX_H = 50;

type PhotoItem = {
  src: string;                                     // Prefer dataURL for reliability
  caption?: string;
  takenAt?: string;
  mime?: "PNG" | "JPEG" | "JPG" | "WEBP";
};

type GenerateArgs = {
  report: {
    jobsite?: string;
    address?: string;
    city?: string;
    reportDate?: string;
    submittedBy?: string;
    submittedTime?: string;
    summary?: string | string[];
    activities?: { title?: string; text: string }[];
    photos?: PhotoItem[];
  };
  companySettings?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone?: string;
  };
  logoUrl?: string | null;                          // pass dataURL for best results
};

// ---------- Cursor helpers ----------
function ensureSpace(doc: ExtendedJsPDF, needed: number) {
  const y = doc.lastAutoTable?.finalY ?? (doc as any).__cursorY ?? CONTENT_TOP;
  const bottomLimit = doc.internal.pageSize.getHeight() - MARGIN - FOOTER_H;
  if (y + needed > bottomLimit) {
    doc.addPage();
    drawHeader(doc, (doc as any).__lastHeaderArgs); // keep header consistent
    (doc as any).__cursorY = CONTENT_TOP;
  }
}

function setCursor(doc: ExtendedJsPDF, y: number) {
  (doc as any).__cursorY = y;
}
function getCursor(doc: ExtendedJsPDF) {
  return (doc as any).__cursorY ?? CONTENT_TOP;
}

// ---------- Header / Footer ----------
function drawHeader(doc: ExtendedJsPDF, args: GenerateArgs) {
  (doc as any).__lastHeaderArgs = args; // remember for subsequent pages

  // separator
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + HEADER_H, doc.internal.pageSize.getWidth() - MARGIN, MARGIN + HEADER_H);

  // logo (left, proportional)
  if (args.logoUrl) {
    let w = LOGO_MAX_W, h = LOGO_MAX_H;
    try {
      const p = doc.getImageProperties?.(args.logoUrl);
      if (p?.width && p?.height) {
        const r = p.width / p.height;
        if (w / h > r) { h = LOGO_MAX_H; w = h * r; }
        else { w = LOGO_MAX_W; h = w / r; }
      }
    } catch { /* ignore */ }
    doc.addImage(args.logoUrl, "PNG", MARGIN, MARGIN + (HEADER_H - h) / 2 - 6, w, h, "", "FAST");
  }

  // title (center)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PRIMARY);
  doc.setFontSize(18);
  doc.text("DAILY REPORT", doc.internal.pageSize.getWidth() / 2, MARGIN + 30, { align: "center" });

  // company block (right)
  const cs = args.companySettings ?? {};
  const rightX = doc.internal.pageSize.getWidth() - MARGIN;
  const lines: string[] = [];
  if (cs.name) lines.push(cs.name);
  if (cs.address) lines.push(cs.address);
  const contact = [cs.phone, cs.email].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  let y = MARGIN + 12;
  lines.forEach((l) => { doc.text(l, rightX, y, { align: "right" }); y += 13; });
}

function drawFooter(doc: ExtendedJsPDF, timezone?: string) {
  const pageCount = (doc as any).getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const generatedDate = new Date().toLocaleDateString();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const leftText = timezone ? 
      `Generated ${generatedDate} • Times shown in ${timezone}` : 
      `Generated ${generatedDate}`;
    doc.text(leftText, MARGIN, h - MARGIN);
    doc.text(`Page ${i} of ${pageCount}`, w - MARGIN, h - MARGIN, { align: "right" });
  }
}

// ---------- Sections ----------
function metaTable(doc: ExtendedJsPDF, report: GenerateArgs["report"]) {
  autoTable(doc, {
    startY: CONTENT_TOP,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6, lineWidth: 0.2, lineColor: BORDER },
    headStyles: { fillColor: ACCENT, textColor: "#ffffff", halign: "center" as const },
    columnStyles: { 0: { cellWidth: 120 } },
    head: [["Jobsite", "Address", "Report Date", "Submitted By", "Time"]],
    body: [[
      report.jobsite || "-",
      report.address || report.city || "-",
      report.reportDate || "-",
      report.submittedBy || "-",
      report.submittedTime || "-",
    ]],
    didDrawPage: (data) => {
      if (data.pageNumber === 1) return;
      drawHeader(doc, (doc as any).__lastHeaderArgs);
    },
    margin: { left: MARGIN, right: MARGIN },
  });
  setCursor(doc, (doc.lastAutoTable?.finalY ?? CONTENT_TOP) + 16);
}

function cardTitle(doc: ExtendedJsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(PRIMARY);
  doc.text(title, MARGIN, y);
}

function summaryCard(doc: ExtendedJsPDF, summary: string | string[]) {
  const startY = getCursor(doc);
  ensureSpace(doc, 90);
  cardTitle(doc, "Summary", startY);

  const boxX = MARGIN;
  const boxY = startY + 10;
  const boxW = doc.internal.pageSize.getWidth() - MARGIN * 2;

  doc.setFillColor(CARD_BG);
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.6);
  (doc as any).roundedRect?.(boxX, boxY, boxW, 0, 6, 6, "F");

  const text = Array.isArray(summary) ? summary.join("\n\n") : (summary || "-");
  const wrapped = doc.splitTextToSize(text, boxW - 20);

  let y = boxY + 18;
  const bottom = doc.internal.pageSize.getHeight() - MARGIN - FOOTER_H;
  const lineH = 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY);

  for (const line of wrapped) {
    if (y + lineH > bottom) {
      // close previous box
      const height = y - boxY + 8;
      (doc as any).roundedRect?.(boxX, boxY, boxW, height, 6, 6, "S");

      doc.addPage();
      drawHeader(doc, (doc as any).__lastHeaderArgs);
      const contTitleY = CONTENT_TOP;
      cardTitle(doc, "Summary (cont.)", contTitleY);

      y = contTitleY + 10;
      // new box start
      (doc as any).roundedRect?.(boxX, y, boxW, 0, 6, 6, "F");
      y += 18;
    }
    doc.text(line, MARGIN + 10, y);
    y += lineH;
  }

  const finalH = y - boxY;
  (doc as any).roundedRect?.(boxX, boxY, boxW, finalH, 6, 6, "S");
  setCursor(doc, y + 10);
}

function activitiesSection(doc: ExtendedJsPDF, activities: { title?: string; text: string }[]) {
  const startY = getCursor(doc);
  ensureSpace(doc, 40);
  cardTitle(doc, "Activities / Notes", startY);

  let y = startY + 16;
  const boxX = MARGIN;
  const boxW = doc.internal.pageSize.getWidth() - MARGIN * 2;
  const bottom = doc.internal.pageSize.getHeight() - MARGIN - FOOTER_H;

  for (const [idx, a] of activities.entries()) {
    const title = a.title ? `• ${a.title}` : `• Item ${idx + 1}`;
    const text = doc.splitTextToSize(a.text, boxW - 16);
    const blockH = 16 + text.length * 14 + 8;

    if (y + blockH > bottom) {
      doc.addPage();
      drawHeader(doc, (doc as any).__lastHeaderArgs);
      y = CONTENT_TOP;
      cardTitle(doc, "Activities / Notes (cont.)", y);
      y += 16;
    }

    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(PRIMARY);
    doc.text(title, boxX + 4, y);
    y += 12;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(PRIMARY);
    text.forEach((line: string) => { doc.text(line, boxX + 12, y); y += 14; });

    // divider
    doc.setDrawColor(BORDER); doc.setLineWidth(0.5);
    doc.line(boxX, y, boxX + boxW, y);
    y += 8;
  }
  setCursor(doc, y);
}

// ---- Images ----
function safeAddImage(
  doc: ExtendedJsPDF, img: PhotoItem,
  x: number, y: number, maxW: number, maxH: number
) {
  const format = img.mime || (img.src.startsWith("data:image/png") ? "PNG" : "JPEG");
  try {
    const props = doc.getImageProperties?.(img.src);
    let w = maxW, h = maxH;
    if (props?.width && props?.height) {
      const r = props.width / props.height;
      if (maxW / maxH > r) { h = maxH; w = h * r; } else { w = maxW; h = w / r; }
    }
    doc.addImage(img.src, format as any, x + (maxW - w) / 2, y + (maxH - h) / 2, w, h, "", "FAST");
    return true;
  } catch {
    return false;
  }
}

function photosSection(doc: ExtendedJsPDF, photos: PhotoItem[]) {
  if (!photos?.length) return;

  const startY = getCursor(doc);
  ensureSpace(doc, 50);
  cardTitle(doc, "Photos", startY);

  let y = startY + 18;
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const innerW = pageW - MARGIN * 2;
  const bottom = pageH - MARGIN - FOOTER_H - 4;     // hard guard above footer

  // Larger images: fixed 2 columns on A4
  const columns = 2;
  const gap = 14;
  const cellW = (innerW - gap) / columns;
  const cellH = 190;                                 // bigger photos

  const captionPad = 14;                             // space below each photo for caption

  photos.forEach((p, idx) => {
    const col = idx % columns;
    const x = MARGIN + col * (cellW + gap);

    if (idx !== 0 && col === 0) {
      // new row
      y += cellH + captionPad + 24;
    }

    // If next cell would breach the footer, go to new page
    if (y + cellH + captionPad > bottom) {
      doc.addPage();
      drawHeader(doc, (doc as any).__lastHeaderArgs);
      y = CONTENT_TOP;
      cardTitle(doc, "Photos (cont.)", y);
      y += 18;
    }

    // frame
    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.5);
    doc.rect(x, y, cellW, cellH);

    // image
    safeAddImage(doc, p, x, y, cellW, cellH);

    // caption
    const caption = [p.caption, p.takenAt].filter(Boolean).join(" • ");
    if (caption) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(MUTED);
      const wrapped = doc.splitTextToSize(caption, cellW - 8);
      let capY = y + cellH + 12;
      wrapped.forEach((line: string) => { doc.text(line, x + 4, capY); capY += 11; });
    }
  });

  // advance cursor after last row
  const rows = Math.ceil(photos.length / columns);
  const lastY = startY + 18 + rows * (cellH + captionPad + 24);
  setCursor(doc, lastY);
}

// ---------- Public API ----------
export const useDailyReportPDF = () => {
  const generateDailyReportPDF = async ({ 
    report, 
    companySettings, 
    logoUrl,
    returnBlob = false 
  }: GenerateArgs & { returnBlob?: boolean }) => {
    const doc = new jsPDF("p", "pt", "a4") as ExtendedJsPDF;

    // Header on first page
    drawHeader(doc, { report, companySettings, logoUrl });

    // Meta
    metaTable(doc, report);

    // Summary
    if (report.summary && (Array.isArray(report.summary) ? report.summary.join("").trim() : String(report.summary).trim())) {
      summaryCard(doc, report.summary!);
    }

    // Activities
    if (report.activities?.length) {
      activitiesSection(doc, report.activities);
    }

    // Photos (larger + footer-safe)
    if (report.photos?.length) {
      photosSection(doc, report.photos);
    }

    // Footer/page numbers
    drawFooter(doc, companySettings?.timezone);

    // Return blob or save based on parameter
    if (returnBlob) {
      return doc.output('blob');
    } else {
      // Save
      const safeJobsite = (report.jobsite || "Jobsite").replace(/[^\w\d\-_. ]+/g, "");
      const safeDate = (report.reportDate || "").replace(/[^\w\d\-_. ]+/g, "");
      doc.save(`Daily_Report_${safeJobsite}_${safeDate}.pdf`);
    }
  };

  return { generateDailyReportPDF };
};
