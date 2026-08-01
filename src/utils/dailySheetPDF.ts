import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PdfBranding } from '@/utils/manualTimesheetPDF';
import { calcHours, formatDateLongLocal, formatTime12h } from '@/utils/dailySheetTime';

export interface DailySheetCrewRow {
  id: string;
  name: string;
  role?: string | null;
  start: string;
  end: string;
  breakMinutes: number;
}

export interface DailySheetData {
  projectName: string;
  date: string; // yyyy-MM-dd
  crew: DailySheetCrewRow[];
  notes?: string | null;
}

const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const getImageSize = (dataUrl: string): Promise<{ w: number; h: number }> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = dataUrl;
  });

const detectImageFormat = (dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
  const m = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp)/i);
  if (!m) return 'PNG';
  const t = m[1].toLowerCase();
  if (t === 'jpg' || t === 'jpeg') return 'JPEG';
  if (t === 'webp') return 'WEBP';
  return 'PNG';
};

export const generateDailySheetPDF = async (
  data: DailySheetData,
  branding: PdfBranding
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // ===== Header band
  const HEADER_BAND = 70;
  let textX = margin;
  if (branding.logoUrl) {
    const dataUrl = await loadImageAsDataUrl(branding.logoUrl);
    if (dataUrl) {
      try {
        const { w, h } = await getImageSize(dataUrl);
        if (w > 0 && h > 0) {
          const ratio = Math.min(160 / w, HEADER_BAND / h);
          const drawW = w * ratio;
          const drawH = h * ratio;
          doc.addImage(
            dataUrl,
            detectImageFormat(dataUrl),
            margin,
            y + (HEADER_BAND - drawH) / 2,
            drawW,
            drawH
          );
          textX = margin + drawW + 18;
        }
      } catch {
        // ignore
      }
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(branding.companyName ?? 'Company', textX, y + HEADER_BAND / 2 - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(110, 110, 110);
  doc.text('DAILY SHEET', textX, y + HEADER_BAND / 2 + 14);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, pageWidth - margin, y + 15, {
    align: 'right',
  });
  doc.setTextColor(0, 0, 0);

  y += HEADER_BAND + 18;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // ===== Meta block
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Project:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.projectName || '—', margin + 70, y);

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateLongLocal(data.date), margin + 70, y);

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Workers:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(data.crew.length), margin + 70, y);

  y += 26;

  // ===== Crew table
  const totalHours = data.crew.reduce(
    (acc, r) => acc + calcHours(r.start, r.end, r.breakMinutes),
    0
  );

  autoTable(doc, {
    startY: y,
    head: [['#', 'Employee', 'Role / Trade', 'Start', 'End', 'Break', 'Total Hours']],
    body: data.crew.map((r, i) => [
      String(i + 1),
      r.name,
      r.role || '—',
      formatTime12h(r.start),
      formatTime12h(r.end),
      r.breakMinutes ? `${r.breakMinutes} min` : '—',
      calcHours(r.start, r.end, r.breakMinutes).toFixed(2),
    ]),
    foot: [['', `Total (${data.crew.length} workers)`, '', '', '', '', totalHours.toFixed(2)]],
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [255, 122, 0], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'right' },
    },
  });

  // @ts-expect-error - lastAutoTable is added by the plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 28;

  // ===== Notes
  if (data.notes && data.notes.trim()) {
    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }
    };

    ensureSpace(40);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('NOTES', margin, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(data.notes.trim(), pageWidth - margin * 2);
    for (const line of lines) {
      ensureSpace(13);
      doc.text(line, margin, y);
      y += 13;
    }
    doc.setTextColor(0, 0, 0);
  }

  // ===== Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  const safeProject = (data.projectName || 'Project').replace(/[^a-z0-9]+/gi, '-');
  doc.save(`Daily-Sheet_${safeProject}_${data.date}.pdf`);
};
