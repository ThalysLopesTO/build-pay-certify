import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDayLabel, formatScheduleTime, formatWeekRange } from '@/utils/weeklyScheduleWeek';

export interface WeeklyScheduleBranding {
  companyName?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export interface WeeklySchedulePdfEntry {
  date: string; // yyyy-MM-dd
  client_name?: string | null;
  start_time?: string | null;
  address?: string | null;
  service?: string | null;
  notes?: string | null;
}

export interface WeeklySchedulePdfSheet {
  assigneeName: string;
  weekStart: string;
  entries: WeeklySchedulePdfEntry[];
  notes?: string | null;
}

// ===== Palette — the dark/gold brand band, with the orange + green rows of the
// spreadsheet the office already recognises.
const DARK: [number, number, number] = [28, 26, 23];
const GOLD: [number, number, number] = [201, 162, 39];
const ORANGE: [number, number, number] = [255, 192, 0];
const GREEN: [number, number, number] = [169, 208, 142];
const GREY: [number, number, number] = [205, 203, 199];
const TEXT: [number, number, number] = [35, 33, 30];

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

/**
 * One page per employee/team, laid out like the weekly schedule spreadsheet:
 * brand band, the assignee name, then Mon→Sun rows.
 */
export const generateWeeklySchedulePDF = async (
  sheets: WeeklySchedulePdfSheet[],
  branding: WeeklyScheduleBranding
): Promise<void> => {
  if (sheets.length === 0) throw new Error('Nothing to export');

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 34;
  const contentW = pageWidth - margin * 2;

  // Fetch the logo once for the whole document.
  let logo: { dataUrl: string; w: number; h: number } | null = null;
  if (branding.logoUrl) {
    const dataUrl = await loadImageAsDataUrl(branding.logoUrl);
    if (dataUrl) {
      const { w, h } = await getImageSize(dataUrl);
      if (w > 0 && h > 0) logo = { dataUrl, w, h };
    }
  }

  sheets.forEach((sheet, index) => {
    if (index > 0) doc.addPage();

    // ===== Header band
    const HEADER_H = 84;
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageWidth, HEADER_H, 'F');

    const splitX = pageWidth * 0.34;
    doc.setFillColor(...GOLD);
    doc.triangle(splitX - 10, 0, splitX + 26, 0, splitX - 26, HEADER_H, 'F');
    doc.setFillColor(...DARK);
    doc.triangle(splitX - 2, 0, splitX + 26, 0, splitX - 18, HEADER_H, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, HEADER_H, pageWidth, 5, 'F');

    if (logo) {
      const ratio = Math.min(160 / logo.w, 56 / logo.h);
      const drawW = logo.w * ratio;
      const drawH = logo.h * ratio;
      try {
        doc.addImage(
          logo.dataUrl,
          detectImageFormat(logo.dataUrl),
          margin,
          (HEADER_H - drawH) / 2,
          drawW,
          drawH
        );
      } catch {
        // ignore logo failures — the title below still identifies the sheet
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.text((branding.companyName ?? 'COMPANY').toUpperCase(), margin, HEADER_H / 2 + 2, {
        maxWidth: splitX - margin - 40,
      });
    }

    const titleCenter = splitX + (pageWidth - splitX) / 2 + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(23);
    doc.setTextColor(...GOLD);
    doc.text('WEEKLY SCHEDULE', titleCenter, 40, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(235, 232, 226);
    doc.text(formatWeekRange(sheet.weekStart), titleCenter, 60, { align: 'center' });

    // ===== Assignee band ("Employee Name or Team")
    let y = HEADER_H + 5 + 18;
    const BAND_H = 22;
    doc.setFillColor(...ORANGE);
    doc.rect(margin, y, contentW, BAND_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text('EMPLOYEE NAME OR TEAM', margin + contentW / 2, y + BAND_H / 2 + 3.5, {
      align: 'center',
      charSpace: 0.4,
    });

    y += BAND_H;
    const NAME_H = 26;
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.8);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentW, NAME_H, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...TEXT);
    doc.text(sheet.assigneeName || '—', margin + contentW / 2, y + NAME_H / 2 + 4.5, {
      align: 'center',
      maxWidth: contentW - 16,
    });

    y += NAME_H + 12;

    // ===== Day rows
    const body = sheet.entries.map(e => [
      formatDayLabel(e.date),
      (e.client_name ?? '').trim(),
      formatScheduleTime(e.start_time),
      (e.address ?? '').trim(),
      (e.service ?? '').trim(),
      (e.notes ?? '').trim(),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['DATE', 'CLIENT / JOB SITE', 'START TIME', 'ADDRESS', 'SERVICE', 'NOTES']],
      body,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 6,
        lineColor: GREY,
        lineWidth: 0.6,
        textColor: TEXT,
        valign: 'middle',
        minCellHeight: 24,
      },
      headStyles: {
        fillColor: ORANGE,
        textColor: TEXT,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 118, fillColor: GREEN, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 130 },
        2: { cellWidth: 76, halign: 'center' },
        3: { cellWidth: 168 },
        4: { cellWidth: 84, halign: 'center' },
        5: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin, bottom: 52 },
    });

    // ===== Week notes
    const finalY = (doc as any).lastAutoTable?.finalY ?? y;
    const noteText = (sheet.notes ?? '').trim();
    if (noteText) {
      let noteY = finalY + 16;
      if (noteY > pageHeight - 110) {
        doc.addPage();
        noteY = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text('WEEK NOTES', margin, noteY);
      noteY += 12;

      const lines = doc.splitTextToSize(noteText, contentW - 16) as string[];
      const boxH = Math.max(34, lines.length * 12 + 14);
      doc.setDrawColor(...GREY);
      doc.setLineWidth(0.7);
      doc.setFillColor(250, 249, 247);
      doc.rect(margin, noteY, contentW, boxH, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...TEXT);
      doc.text(lines, margin + 8, noteY + 15);
    }
  });

  // ===== Footer band on every page
  const contactParts = [branding.phone, branding.email, branding.website].filter(
    (v): v is string => !!v && !!v.trim()
  );
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const bandH = 28;
    const bandY = pageHeight - bandH;
    doc.setFillColor(...DARK);
    doc.rect(0, bandY, pageWidth, bandH, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, bandY - 3, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(235, 232, 226);
    const left = contactParts.length ? contactParts.join('   |   ') : (branding.companyName ?? '');
    doc.text(left, margin, bandY + bandH / 2 + 3, { maxWidth: pageWidth - margin * 2 - 120 });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(`PAGE ${i} OF ${pageCount}`, pageWidth - margin, bandY + bandH / 2 + 3, {
      align: 'right',
      charSpace: 0.5,
    });
  }

  const safeName =
    sheets.length === 1
      ? (sheets[0].assigneeName || 'Schedule').replace(/[^a-z0-9]+/gi, '-')
      : 'All';
  doc.save(`Weekly-Schedule_${safeName}_${sheets[0].weekStart}.pdf`);
};
