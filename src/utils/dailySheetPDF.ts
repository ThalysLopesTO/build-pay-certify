import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calcHours, formatDateLongLocal, formatTime12h } from '@/utils/dailySheetTime';

export interface DailySheetBranding {
  companyName?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  tagline?: string | null;
}

export interface DailySheetCrewRow {
  id: string;
  name: string;
  role?: string | null;
  start: string;
  end: string;
  breakMinutes: number;
  notes?: string | null;
}

export type DailySheetWeather = 'sunny' | 'partly' | 'cloudy' | 'rain' | '';

export interface DailySheetData {
  projectName: string;
  date: string; // yyyy-MM-dd
  crew: DailySheetCrewRow[];
  notes?: string | null;
  poBuilder?: string | null;
  jobName?: string | null;
  siteAddress?: string | null;
  supervisor?: string | null;
  weather?: DailySheetWeather;
  safetyMeeting?: 'yes' | 'no' | '';
  meetingTime?: string | null;
}

// ===== Palette
const DARK: [number, number, number] = [28, 26, 23];
const GOLD: [number, number, number] = [201, 162, 39];
const GREY: [number, number, number] = [205, 203, 199];
const LIGHT: [number, number, number] = [248, 247, 245];
const TEXT: [number, number, number] = [35, 33, 30];

const MIN_ROWS = 15;

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
  branding: DailySheetBranding
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 34;
  const contentW = pageWidth - margin * 2;

  // ============================================================
  // HEADER BAND
  // ============================================================
  const HEADER_H = 92;
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, HEADER_H, 'F');

  // Gold diagonal accent separating logo area and title area
  const splitX = pageWidth * 0.46;
  doc.setFillColor(...GOLD);
  doc.triangle(splitX - 10, 0, splitX + 26, 0, splitX - 26, HEADER_H, 'F');
  doc.setFillColor(...DARK);
  doc.triangle(splitX - 2, 0, splitX + 26, 0, splitX - 18, HEADER_H, 'F');
  // Gold underline strip
  doc.setFillColor(...GOLD);
  doc.rect(0, HEADER_H, pageWidth, 5, 'F');

  // Logo (left)
  let logoBottom = 0;
  if (branding.logoUrl) {
    const dataUrl = await loadImageAsDataUrl(branding.logoUrl);
    if (dataUrl) {
      try {
        const { w, h } = await getImageSize(dataUrl);
        if (w > 0 && h > 0) {
          const ratio = Math.min(190 / w, 58 / h);
          const drawW = w * ratio;
          const drawH = h * ratio;
          const top = (HEADER_H - drawH) / 2;
          doc.addImage(dataUrl, detectImageFormat(dataUrl), margin, top, drawW, drawH);
          logoBottom = top + drawH;
        }
      } catch {
        // ignore logo failures
      }
    }
  }

  if (!logoBottom) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(255, 255, 255);
    doc.text((branding.companyName ?? 'COMPANY').toUpperCase(), margin, HEADER_H / 2 + 2, {
      maxWidth: splitX - margin - 40,
    });
    logoBottom = HEADER_H / 2 + 6;
  }

  if (branding.tagline) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(branding.tagline.toUpperCase(), margin, Math.min(logoBottom + 13, HEADER_H - 8), {
      charSpace: 2,
    });
  }

  // Title (right)
  const titleCenter = splitX + (pageWidth - splitX) / 2 + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...GOLD);
  doc.text('DAILY TIMESHEET', titleCenter, 42, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const subtitle = (data.projectName || 'DAILY SHEET').toUpperCase();
  doc.text(subtitle, titleCenter, 62, {
    align: 'center',
    maxWidth: pageWidth - splitX - 30,
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(215, 210, 200);
  doc.text(formatDateLongLocal(data.date), titleCenter, 78, { align: 'center' });

  let y = HEADER_H + 5 + 20;

  // ============================================================
  // INFO GRID
  // ============================================================
  const ROW_H = 24;
  const colW = contentW / 2;
  const labelW = 108;

  const drawInfoCell = (
    x: number,
    yy: number,
    w: number,
    label: string,
    value: string,
    renderValue?: (vx: number, vy: number, vw: number) => void
  ) => {
    // label box
    doc.setFillColor(...DARK);
    doc.rect(x, yy, labelW, ROW_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(label.toUpperCase(), x + 7, yy + ROW_H / 2 + 2.6, { charSpace: 0.3 });

    // value box
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.7);
    doc.setFillColor(255, 255, 255);
    doc.rect(x + labelW, yy, w - labelW, ROW_H, 'FD');

    if (renderValue) {
      renderValue(x + labelW + 8, yy + ROW_H / 2 + 3, w - labelW - 16);
    } else if (value) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...TEXT);
      doc.text(value, x + labelW + 8, yy + ROW_H / 2 + 3, { maxWidth: w - labelW - 16 });
    }
  };

  const checkbox = (x: number, cy: number, checked: boolean) => {
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.8);
    doc.rect(x, cy - 6, 9, 9, 'S');
    if (checked) {
      doc.setFillColor(...GOLD);
      doc.rect(x + 1.8, cy - 4.2, 5.4, 5.4, 'F');
    }
  };

  const leftRows: Array<[string, string]> = [
    ['PO / Builder', data.poBuilder ?? ''],
    ['Job Name', data.jobName || data.projectName || ''],
    ['Site Address', data.siteAddress ?? ''],
  ];

  leftRows.forEach(([label, value], i) => {
    drawInfoCell(margin, y + i * ROW_H, colW, label, value);
  });

  // Right column
  drawInfoCell(margin + colW, y, colW, 'Date', formatDateLongLocal(data.date));
  drawInfoCell(margin + colW, y + ROW_H, colW, 'Supervisor', data.supervisor ?? '');
  drawInfoCell(margin + colW, y + ROW_H * 2, colW, 'Weather', '', (vx, vy, vw) => {
    const opts: Array<[DailySheetWeather, string]> = [
      ['sunny', 'Sunny'],
      ['partly', 'Partly'],
      ['cloudy', 'Cloudy'],
      ['rain', 'Rain'],
    ];
    const step = vw / opts.length;
    opts.forEach(([key, text], i) => {
      const bx = vx + i * step;
      checkbox(bx, vy - 1, data.weather === key);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT);
      doc.text(text, bx + 13, vy);
    });
  });

  // Safety meeting row (spans right column, aligned with a 4th left row)
  drawInfoCell(margin, y + ROW_H * 3, colW, 'Claim #', '');
  drawInfoCell(margin + colW, y + ROW_H * 3, colW, 'Safety Meeting', '', (vx, vy, vw) => {
    checkbox(vx, vy - 1, data.safetyMeeting === 'yes');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT);
    doc.text('YES', vx + 13, vy);
    const nx = vx + vw / 2;
    checkbox(nx, vy - 1, data.safetyMeeting === 'no');
    doc.text('NO', nx + 13, vy);
    if (data.meetingTime) {
      doc.setFontSize(8);
      doc.setTextColor(90, 88, 84);
      doc.text(`Time: ${formatTime12h(data.meetingTime)}`, vx + vw, vy, { align: 'right' });
    }
  });

  y += ROW_H * 4 + 18;

  // ============================================================
  // CREW TABLE
  // ============================================================
  const totalHours = data.crew.reduce(
    (acc, r) => acc + calcHours(r.start, r.end, r.breakMinutes),
    0
  );

  const body: Array<Array<string>> = data.crew.map((r, i) => [
    String(i + 1),
    r.name,
    r.role || '',
    formatTime12h(r.start),
    formatTime12h(r.end),
    r.breakMinutes ? `${r.breakMinutes} min` : '',
    calcHours(r.start, r.end, r.breakMinutes).toFixed(2),
    r.notes || '',
  ]);

  // Pad with blank ruled rows so the sheet reads like a printed form
  for (let i = body.length; i < MIN_ROWS; i++) {
    body.push([String(i + 1), '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [
      [
        'NO.',
        'EMPLOYEE NAME',
        'POSITION / TRADE',
        'TIME IN',
        'TIME OUT',
        'BREAK\n(UNPAID)',
        'TOTAL\nHOURS',
        'NOTES',
      ],
    ],
    body,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 },
      lineColor: GREY,
      lineWidth: 0.6,
      textColor: TEXT,
      minCellHeight: 19,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: DARK,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.8,
      halign: 'center',
      valign: 'middle',
      lineColor: DARK,
      lineWidth: 0.6,
      cellPadding: { top: 6, bottom: 6, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: margin, right: margin, top: margin },
    tableWidth: contentW,
    columnStyles: {
      0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 132, fontStyle: 'bold' },
      2: { cellWidth: 96 },
      3: { cellWidth: 58, halign: 'center' },
      4: { cellWidth: 58, halign: 'center' },
      5: { cellWidth: 52, halign: 'center' },
      6: { cellWidth: 48, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 'auto' },
    },
  });

  // @ts-expect-error - lastAutoTable is added by the plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 56) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // ===== TOTAL HOURS BAR (right aligned under the table)
  ensureSpace(34);
  const barH = 26;
  const barW = 240;
  const barX = margin + contentW - barW;
  const valueW = 82;
  doc.setFillColor(...DARK);
  doc.rect(barX, y, barW - valueW, barH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL HOURS', barX + (barW - valueW) / 2, y + barH / 2 + 4, { align: 'center' });

  doc.setFillColor(...GOLD);
  doc.rect(barX + barW - valueW, y, valueW, barH, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.text(totalHours.toFixed(2), barX + barW - valueW / 2, y + barH / 2 + 4.5, {
    align: 'center',
  });

  y += barH + 18;

  // ============================================================
  // NOTES + SIGNATURE BOXES
  // ============================================================
  const boxH = 118;
  ensureSpace(boxH + 10);
  const gap = 16;
  const boxW = (contentW - gap) / 2;

  const drawBoxShell = (x: number, title: string) => {
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.8);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, boxW, boxH, 'FD');
    doc.setFillColor(...GOLD);
    doc.rect(x, y, boxW, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(title.toUpperCase(), x + 10, y + 20, { charSpace: 0.3 });
  };

  // Site notes
  drawBoxShell(margin, 'Site Notes / Work Completed');
  const noteLines = data.notes?.trim()
    ? doc.splitTextToSize(data.notes.trim(), boxW - 20)
    : [];
  let ly = y + 38;
  const maxNoteLines = 5;
  for (let i = 0; i < maxNoteLines; i++) {
    const text = noteLines[i];
    if (text) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...TEXT);
      doc.text(String(text), margin + 10, ly - 3);
    }
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.5);
    doc.line(margin + 10, ly, margin + boxW - 10, ly);
    ly += 15;
  }
  if (noteLines.length > maxNoteLines) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 118, 114);
    doc.text('(continued on notes page)', margin + 10, y + boxH - 8);
  }

  // Signature
  const sigX = margin + boxW + gap;
  drawBoxShell(sigX, 'Supervisor Signature');
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.7);
  doc.line(sigX + 14, y + 74, sigX + boxW - 14, y + 74);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 118, 114);
  doc.text('Sign here', sigX + 14, y + 84);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text('PRINT NAME:', sigX + 14, y + 104);
  doc.setDrawColor(...GREY);
  doc.line(sigX + 78, y + 106, sigX + boxW - 14, y + 106);
  if (data.supervisor) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(data.supervisor, sigX + 84, y + 103);
  }

  y += boxH + 16;

  // Overflow notes page if the notes were long
  if (noteLines.length > maxNoteLines) {
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text('SITE NOTES / WORK COMPLETED (CONTINUED)', margin, y + 10);
    y += 28;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT);
    for (const line of noteLines.slice(maxNoteLines)) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }
      doc.text(String(line), margin, y);
      y += 14;
    }
  }

  // ============================================================
  // FOOTER BAND on every page
  // ============================================================
  const contactParts = [branding.phone, branding.email, branding.website].filter(
    (v): v is string => !!v && !!v.trim()
  );
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const bandH = 30;
    const bandY = pageHeight - bandH;
    doc.setFillColor(...DARK);
    doc.rect(0, bandY, pageWidth, bandH, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, bandY - 3, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(235, 232, 226);
    const left = contactParts.length
      ? contactParts.join('   |   ')
      : (branding.companyName ?? '');
    doc.text(left, margin, bandY + bandH / 2 + 3, { maxWidth: pageWidth - margin * 2 - 120 });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(`PAGE ${i} OF ${pageCount}`, pageWidth - margin, bandY + bandH / 2 + 3, {
      align: 'right',
      charSpace: 0.5,
    });
  }

  const safeProject = (data.projectName || 'Project').replace(/[^a-z0-9]+/gi, '-');
  doc.save(`Daily-Sheet_${safeProject}_${data.date}.pdf`);
};
