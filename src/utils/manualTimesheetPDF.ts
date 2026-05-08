import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ManualTimesheet } from '@/hooks/useManualTimesheets';
import { formatDateLong } from '@/utils/manualTimesheetDays';

const formatCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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

export interface PdfBranding {
  companyName?: string | null;
  logoUrl?: string | null;
}

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

const renderTimesheetIntoDoc = async (
  doc: jsPDF,
  ts: ManualTimesheet,
  branding: PdfBranding
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // ========= Header
  const HEADER_BAND = 70;
  const MAX_LOGO_W = 160;
  const MAX_LOGO_H = 70;
  let textX = margin;

  if (branding.logoUrl) {
    const dataUrl = await loadImageAsDataUrl(branding.logoUrl);
    if (dataUrl) {
      try {
        const { w, h } = await getImageSize(dataUrl);
        if (w > 0 && h > 0) {
          const ratio = Math.min(MAX_LOGO_W / w, MAX_LOGO_H / h);
          const drawW = w * ratio;
          const drawH = h * ratio;
          const drawY = y + (HEADER_BAND - drawH) / 2;
          doc.addImage(dataUrl, detectImageFormat(dataUrl), margin, drawY, drawW, drawH);
          textX = margin + drawW + 18;
        }
      } catch {
        // ignore
      }
    }
  }

  // Vertically center text in the header band
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(branding.companyName ?? 'Company', textX, y + HEADER_BAND / 2 - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(110, 110, 110);
  doc.text('TIME SHEET', textX, y + HEADER_BAND / 2 + 14);
  doc.setTextColor(0, 0, 0);

  // Right-aligned meta
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, pageWidth - margin, y + 15, {
    align: 'right',
  });
  doc.text(`Created: ${new Date(ts.created_at).toLocaleDateString('en-US')}`, pageWidth - margin, y + 30, {
    align: 'right',
  });
  doc.setTextColor(0, 0, 0);

  // ========= Employee avatar (circular) — top-right area
  const AVATAR_R = 26; // radius pt
  const avatarCx = pageWidth - margin - AVATAR_R;
  const avatarCy = y + HEADER_BAND + 8 + AVATAR_R;
  let avatarDrawn = false;

  if (ts.employee_photo_url) {
    const photoData = await loadImageAsDataUrl(ts.employee_photo_url);
    if (photoData) {
      try {
        const { w: iw, h: ih } = await getImageSize(photoData);
        if (iw > 0 && ih > 0) {
          // Cover the circle: scale image so the shorter dimension equals 2R
          const scale = (2 * AVATAR_R) / Math.min(iw, ih);
          const drawW = iw * scale;
          const drawH = ih * scale;
          const drawX = avatarCx - drawW / 2;
          const drawY = avatarCy - drawH / 2;

          doc.saveGraphicsState();
          doc.circle(avatarCx, avatarCy, AVATAR_R, null as any);
          doc.clip();
          doc.discardPath();
          doc.addImage(photoData, detectImageFormat(photoData), drawX, drawY, drawW, drawH);
          doc.restoreGraphicsState();

          avatarDrawn = true;
        }
      } catch {
        // ignore — fall through to initials fallback
      }
    }
  }

  if (!avatarDrawn) {
    // Initials fallback
    doc.setFillColor(240, 240, 240);
    doc.circle(avatarCx, avatarCy, AVATAR_R, 'F');
    const parts = (ts.employee_name ?? '').split(/\s+/).filter(Boolean).slice(0, 2);
    const init = parts.map(p => p.charAt(0).toUpperCase()).join('') || '?';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(110, 110, 110);
    doc.text(init, avatarCx, avatarCy + 5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  // Border ring
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.8);
  doc.circle(avatarCx, avatarCy, AVATAR_R, 'S');

  y += 90;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // ========= Meta block
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee:', margin, y);
  doc.setFont('helvetica', 'normal');
  const employeeLine = ts.employee_role
    ? `${ts.employee_name} (${ts.employee_role})`
    : ts.employee_name;
  doc.text(employeeLine, margin + 90, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Project:', pageWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(ts.project_name, pageWidth / 2 + 60, y);

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Period:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${formatDateLong(ts.pay_period_start)}  -  ${formatDateLong(ts.pay_period_end)}`,
    margin + 90,
    y
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Type:', pageWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(ts.timesheet_type === 'hourly' ? 'Hourly' : 'Project', pageWidth / 2 + 60, y);

  y += 25;

  // ========= Daily hours table
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Day', 'Hours Worked']],
    body: ts.daily_hours.map(d => [formatDateLong(d.date), d.day, d.hours.toFixed(2)]),
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [255, 122, 0], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: margin, right: margin },
    columnStyles: {
      2: { halign: 'right' },
    },
  });

  // jspdf-autotable v5 cursor
  // @ts-expect-error - lastAutoTable is added by plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 25;

  // ========= Totals block
  const taxLabel = ts.tax_percent && Number(ts.tax_percent) > 0
    ? `Tax (${Number(ts.tax_percent)}%)`
    : 'Tax';
  const rows: Array<[string, string]> = [
    ['Total Hours', ts.total_hours.toFixed(2)],
    ['Hourly Rate', formatCurrency(ts.hourly_rate)],
    ['Extra Amount', formatCurrency(ts.extra_amount)],
    ['Subtotal', formatCurrency(ts.subtotal)],
    [taxLabel, formatCurrency(ts.tax_amount)],
  ];

  autoTable(doc, {
    startY: y,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 200 },
      1: { halign: 'right' },
    },
    margin: { left: pageWidth - margin - 320, right: margin },
  });

  // @ts-expect-error - lastAutoTable is added by plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 5;

  // Total payment highlight
  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(1);
  doc.line(pageWidth - margin - 320, y, pageWidth - margin, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL PAYMENT', pageWidth - margin - 320, y);
  doc.text(formatCurrency(ts.total_payment), pageWidth - margin, y, { align: 'right' });
  y += 30;

  // ========= Notes
  if (ts.notes && ts.notes.trim()) {
    const pageHeight = doc.internal.pageSize.getHeight();
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
    const lines = doc.splitTextToSize(ts.notes.trim(), pageWidth - margin * 2);
    const lineHeight = 13;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    doc.setTextColor(0, 0, 0);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' }
    );
  }

  const safeName = ts.employee_name.replace(/[^a-z0-9]+/gi, '_');
  doc.save(`Timesheet_${safeName}_${ts.pay_period_start}_${ts.pay_period_end}.pdf`);
};
