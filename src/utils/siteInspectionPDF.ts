import jsPDF from 'jspdf';
import {
  SITE_INSPECTION_SECTIONS,
  QUALITY_CONTROL_TOGGLES,
  COMPANY_STANDARD_TEXT,
  COMPANY_VALUES,
  type ChecklistSection,
} from './siteInspectionChecklist';

export interface SiteInspectionBranding {
  companyName?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export interface SiteInspectionSignatureData {
  dataUrl?: string | null;
  printedName?: string | null;
  date?: string | null;
}

export interface SiteInspectionPdfData {
  inspectionDate: string; // yyyy-MM-dd
  clientName?: string | null;
  insuranceCompany?: string | null;
  adjuster?: string | null;
  claimNumber?: string | null;
  jobNumber?: string | null;
  propertyAddress?: string | null;
  supervisor?: string | null;
  crewMembers?: string | null;
  builderCompany?: string | null;
  checklist: Record<string, boolean>;
  qualityControl: {
    moisture_meter?: string;
    final_moisture_reading?: string;
    photos_uploaded?: string;
    customer_walkthrough?: string;
    deficiencies_found?: string;
    corrective_actions?: string;
  };
  comments?: string | null;
  signatures: {
    supervisor?: SiteInspectionSignatureData;
    crewLeader?: SiteInspectionSignatureData;
    client?: SiteInspectionSignatureData;
  };
  photos?: { url: string; caption?: string | null }[];
}

const DARK: [number, number, number] = [17, 17, 17];
const GOLD: [number, number, number] = [198, 160, 56];
const GREY: [number, number, number] = [205, 203, 199];
const LIGHT: [number, number, number] = [243, 242, 240];
const TEXT: [number, number, number] = [30, 29, 27];

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

const detectFormat = (dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
  const m = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp)/i);
  if (!m) return 'PNG';
  const t = m[1].toLowerCase();
  if (t === 'jpg' || t === 'jpeg') return 'JPEG';
  if (t === 'webp') return 'WEBP';
  return 'PNG';
};

const formatDateLong = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const generateSiteInspectionPDF = async (
  data: SiteInspectionPdfData,
  branding: SiteInspectionBranding,
  options?: { output?: 'save' | 'blob' }
): Promise<{ blob: Blob; filename: string }> => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 26;
  const contentW = pageW - margin * 2;
  const FOOTER_H = 58;

  // ---------- primitives ----------
  const drawCheckbox = (x: number, y: number, size: number, checked: boolean) => {
    doc.setDrawColor(120, 118, 114);
    doc.setLineWidth(0.7);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, size, size, 'FD');
    if (checked) {
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(1.4);
      doc.line(x + 1.4, y + size * 0.55, x + size * 0.4, y + size - 1.6);
      doc.line(x + size * 0.4, y + size - 1.6, x + size - 1.2, y + 1.4);
      doc.setLineWidth(0.7);
    }
  };

  const sectionTab = (x: number, y: number, label: string, w: number) => {
    const h = 17;
    doc.setFillColor(...DARK);
    doc.rect(x, y, w, h, 'F');
    doc.triangle(x + w, y, x + w + 11, y, x + w, y + h, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GOLD);
    doc.text(label.toUpperCase(), x + 8, y + h / 2 + 3, { charSpace: 0.4 });
    return h;
  };

  // ---------- HEADER BAND ----------
  const HEADER_H = 96;
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, HEADER_H, 'F');
  // gold diagonal accents on the right
  doc.setFillColor(...GOLD);
  doc.triangle(pageW - 86, HEADER_H, pageW - 52, 0, pageW - 38, 0, 'F');
  doc.triangle(pageW - 44, HEADER_H, pageW - 12, 0, pageW - 2, 0, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, HEADER_H, pageW, 4, 'F');

  const logoBoxW = 132;
  // white plate behind the logo so it never gets lost on the dark band
  const plateX = margin;
  const plateY = 12;
  const plateW = logoBoxW - 18;
  const plateH = HEADER_H - 24;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(plateX, plateY, plateW, plateH, 5, 5, 'F');

  let logoDrawn = false;
  if (branding.logoUrl) {
    const dataUrl = await loadImageAsDataUrl(branding.logoUrl);
    if (dataUrl) {
      try {
        const { w, h } = await getImageSize(dataUrl);
        if (w > 0 && h > 0) {
          const ratio = Math.min((plateW - 16) / w, (plateH - 14) / h);
          const dw = w * ratio;
          const dh = h * ratio;
          doc.addImage(
            dataUrl,
            detectFormat(dataUrl),
            plateX + (plateW - dw) / 2,
            plateY + (plateH - dh) / 2,
            dw,
            dh
          );
          logoDrawn = true;
        }
      } catch {
        /* ignore logo failures */
      }
    }
  }
  if (!logoDrawn) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    const nameLines = doc.splitTextToSize((branding.companyName ?? 'COMPANY').toUpperCase(), plateW - 16);
    doc.text(nameLines, plateX + plateW / 2, plateY + plateH / 2, {
      align: 'center',
      baseline: 'middle',
    });
  }

  const titleX = margin + logoBoxW + 4;
  const titleW = pageW - titleX - 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(25);
  doc.setTextColor(255, 255, 255);
  doc.text('FINAL SITE INSPECTION', titleX + titleW / 2, 40, { align: 'center', maxWidth: titleW });


  doc.setFontSize(11.5);
  doc.setTextColor(...GOLD);
  doc.text('WATER DAMAGE  •  DEMOLITION  •  MITIGATION SERVICES', titleX + titleW / 2, 60, {
    align: 'center',
    maxWidth: titleW,
  });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(titleX + 14, 70, titleX + titleW - 14, 70);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('QUALITY  •  SAFETY  •  COMMITMENT TO EXCELLENCE', titleX + titleW / 2, 84, {
    align: 'center',
    charSpace: 0.6,
    maxWidth: titleW,
  });

  let y = HEADER_H + 4 + 14;

  // ---------- PROJECT INFORMATION ----------
  y += sectionTab(margin, y, 'Project Information', 152) + 4;

  const ROW_H = 21;
  const halfW = contentW / 2;
  const labelW = 112;

  const infoCell = (x: number, yy: number, w: number, label: string, value?: string | null, rowH = ROW_H) => {
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.6);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, yy, w, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...TEXT);
    doc.text(label, x + 6, yy + rowH / 2 + 2.4, { maxWidth: labelW - 10 });
    doc.setFillColor(...LIGHT);
    doc.rect(x + labelW, yy + 3, w - labelW - 4, rowH - 6, 'F');
    if (value) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.4);
      doc.setTextColor(...TEXT);
      doc.text(String(value), x + labelW + 6, yy + rowH / 2 + 2.6, { maxWidth: w - labelW - 16 });
    }
  };

  const leftRows: [string, string | null | undefined][] = [
    ['Client:', data.clientName],
    ['Insurance Company:', data.insuranceCompany],
    ['Adjuster:', data.adjuster],
    ['Claim #:', data.claimNumber],
    ['Job #:', data.jobNumber],
  ];
  const rightRows: [string, string | null | undefined][] = [
    ['Date:', formatDateLong(data.inspectionDate)],
    ['Supervisor:', data.supervisor],
    ['Crew Members:', data.crewMembers],
    ['Builder / Restoration:', data.builderCompany],
  ];

  leftRows.forEach(([l, v], i) => infoCell(margin, y + i * ROW_H, halfW, l, v));
  rightRows.forEach(([l, v], i) => infoCell(margin + halfW, y + i * ROW_H, halfW, l, v));
  // fill the empty right slot so the grid reads evenly
  infoCell(margin + halfW, y + rightRows.length * ROW_H, halfW, '', '');

  y += leftRows.length * ROW_H;
  infoCell(margin, y, contentW, 'Property Address:', data.propertyAddress);
  y += ROW_H + 12;

  // ---------- CHECKLIST SECTIONS ----------
  const measureSection = (section: ChecklistSection, w: number): number => {
    const textW = w - 26;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    let h = 18 + 6; // header + padding
    section.items.forEach(item => {
      const lines = doc.splitTextToSize(item.label, textW) as string[];
      h += Math.max(9.5, lines.length * 8) + 3.5;
    });
    return h + 4;
  };

  const drawSection = (section: ChecklistSection, x: number, yy: number, w: number, h: number) => {
    // header
    doc.setFillColor(...DARK);
    doc.rect(x, yy, w, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(`${section.number}. ${section.title.toUpperCase()}`, x + 7, yy + 12, { maxWidth: w - 12 });

    // body
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.6);
    doc.rect(x, yy + 18, w, h - 18, 'S');

    let iy = yy + 18 + 8;
    section.items.forEach(item => {
      const checked = !!data.checklist[item.id];
      drawCheckbox(x + 7, iy - 6.4, 7.4, checked);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...TEXT);
      const lines = doc.splitTextToSize(item.label, w - 26) as string[];
      doc.text(lines, x + 19, iy);
      if (item.isNew) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.6);
        doc.setTextColor(198, 90, 40);
        doc.text('NEW', x + 7, iy + Math.max(8, lines.length * 8) + 0.5);
        doc.setTextColor(...TEXT);
      }
      iy += Math.max(9.5, lines.length * 8) + 3.5;
    });
  };

  const gap = 8;
  const row1 = SITE_INSPECTION_SECTIONS.slice(0, 4);
  const row2 = SITE_INSPECTION_SECTIONS.slice(4, 7);

  const col4W = (contentW - gap * 3) / 4;
  const col3W = (contentW - gap * 2) / 3;

  const row1H = Math.max(...row1.map(s => measureSection(s, col4W)));
  row1.forEach((s, i) => drawSection(s, margin + i * (col4W + gap), y, col4W, row1H));
  y += row1H + 10;

  const row2H = Math.max(...row2.map(s => measureSection(s, col3W)));
  row2.forEach((s, i) => drawSection(s, margin + i * (col3W + gap), y, col3W, row2H));
  y += row2H + 12;

  // ---------- QUALITY CONTROL ----------
  const newPageIfNeeded = (needed: number) => {
    if (y + needed > pageH - FOOTER_H - 12) {
      doc.addPage();
      y = margin + 6;
    }
  };

  newPageIfNeeded(120);
  y += sectionTab(margin, y, 'Quality Control', 122) + 4;

  const qcColW = [contentW * 0.19, contentW * 0.19, contentW * 0.155, contentW * 0.155, contentW * 0.155, contentW * 0.155];
  const qcHeaders = [
    'Moisture Meter Used',
    'Final Moisture Reading',
    ...QUALITY_CONTROL_TOGGLES.map(t => `${t.label} (Yes / No)`),
  ];
  const QC_HEAD_H = 26;
  const QC_BODY_H = 26;
  let qx = margin;
  qcHeaders.forEach((head, i) => {
    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...GREY);
    doc.rect(qx, y, qcColW[i], QC_HEAD_H, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(head, qcColW[i] - 8) as string[];
    doc.text(lines, qx + qcColW[i] / 2, y + QC_HEAD_H / 2 - (lines.length - 1) * 3.6 + 2, { align: 'center' });
    qx += qcColW[i];
  });

  qx = margin;
  const qcValues = [
    data.qualityControl.moisture_meter ?? '',
    data.qualityControl.final_moisture_reading ?? '',
  ];
  const toggleValues = QUALITY_CONTROL_TOGGLES.map(
    t => (data.qualityControl as Record<string, string | undefined>)[t.id] ?? ''
  );

  [0, 1].forEach(i => {
    doc.setDrawColor(...GREY);
    doc.setFillColor(255, 255, 255);
    doc.rect(qx, y + QC_HEAD_H, qcColW[i], QC_BODY_H, 'FD');
    doc.setDrawColor(120, 118, 114);
    doc.line(qx + 10, y + QC_HEAD_H + QC_BODY_H - 8, qx + qcColW[i] - 10, y + QC_HEAD_H + QC_BODY_H - 8);
    if (qcValues[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT);
      doc.text(qcValues[i], qx + qcColW[i] / 2, y + QC_HEAD_H + QC_BODY_H - 11, {
        align: 'center',
        maxWidth: qcColW[i] - 16,
      });
    }
    qx += qcColW[i];
  });

  toggleValues.forEach((val, idx) => {
    const i = idx + 2;
    doc.setDrawColor(...GREY);
    doc.setFillColor(255, 255, 255);
    doc.rect(qx, y + QC_HEAD_H, qcColW[i], QC_BODY_H, 'FD');
    const cy = y + QC_HEAD_H + QC_BODY_H / 2;
    const yesX = qx + qcColW[i] * 0.16;
    const noX = qx + qcColW[i] * 0.58;
    drawCheckbox(yesX, cy - 4, 8, val === 'yes');
    drawCheckbox(noX, cy - 4, 8, val === 'no');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(...TEXT);
    doc.text('Yes', yesX + 11, cy + 2.6);
    doc.text('No', noX + 11, cy + 2.6);
    qx += qcColW[i];
  });

  y += QC_HEAD_H + QC_BODY_H + 12;

  // ---------- COMMENTS ----------
  newPageIfNeeded(110);
  y += sectionTab(margin, y, 'Supervisor Comments / Additional Notes', 246) + 4;

  const commentLines = data.comments
    ? (doc.splitTextToSize(data.comments, contentW - 20) as string[])
    : [];
  const COMMENT_ROWS = Math.max(4, commentLines.length + 1);
  const COMMENT_H = COMMENT_ROWS * 14 + 8;
  doc.setDrawColor(...GREY);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentW, COMMENT_H, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(...TEXT);
  for (let i = 0; i < COMMENT_ROWS; i++) {
    const lineY = y + 10 + i * 14;
    if (commentLines[i]) doc.text(commentLines[i], margin + 10, lineY);
    doc.setDrawColor(226, 224, 220);
    doc.line(margin + 10, lineY + 3, margin + contentW - 10, lineY + 3);
  }
  y += COMMENT_H + 12;

  // ---------- SIGNATURES ----------
  const SIG_H = 84;
  newPageIfNeeded(SIG_H + 26);
  y += sectionTab(margin, y, 'Signatures', 98) + 4;

  const sigDefs: [string, SiteInspectionSignatureData | undefined][] = [
    ['Supervisor Signature:', data.signatures.supervisor],
    ['Crew Leader Signature:', data.signatures.crewLeader],
    ['Client / Restoration Representative (Optional):', data.signatures.client],
  ];
  const sigW = (contentW - gap * 2) / 3;

  for (let i = 0; i < sigDefs.length; i++) {
    const [label, sig] = sigDefs[i];
    const x = margin + i * (sigW + gap);
    doc.setDrawColor(...GREY);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, sigW, SIG_H, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(...TEXT);
    const labelLines = doc.splitTextToSize(label, sigW - 14) as string[];
    doc.text(labelLines, x + 7, y + 11);

    const sigLineY = y + 46;
    if (sig?.dataUrl) {
      try {
        const { w, h } = await getImageSize(sig.dataUrl);
        if (w > 0 && h > 0) {
          const ratio = Math.min((sigW - 24) / w, 26 / h);
          doc.addImage(sig.dataUrl, detectFormat(sig.dataUrl), x + 12, sigLineY - h * ratio - 2, w * ratio, h * ratio);
        }
      } catch {
        /* ignore signature failures */
      }
    }
    doc.setDrawColor(90, 88, 84);
    doc.line(x + 8, sigLineY, x + sigW - 8, sigLineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Printed Name:', x + 8, y + 61);
    doc.setDrawColor(160, 158, 154);
    doc.line(x + 58, y + 62.5, x + sigW - 8, y + 62.5);
    if (sig?.printedName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.text(sig.printedName, x + 61, y + 61, { maxWidth: sigW - 72 });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Date:', x + 8, y + 75);
    doc.line(x + 32, y + 76.5, x + sigW - 8, y + 76.5);
    if (sig?.date) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.text(formatDateLong(sig.date), x + 35, y + 75, { maxWidth: sigW - 46 });
    }
  }
  y += SIG_H;

  // ---------- PHOTO PAGES ----------
  if (data.photos && data.photos.length > 0) {
    for (let i = 0; i < data.photos.length; i += 2) {
      doc.addPage();
      doc.setFillColor(...DARK);
      doc.rect(0, 0, pageW, 34, 'F');
      doc.setFillColor(...GOLD);
      doc.rect(0, 34, pageW, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...GOLD);
      doc.text('SITE PHOTOS', margin, 22);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `${data.jobNumber ? `Job # ${data.jobNumber}  •  ` : ''}${formatDateLong(data.inspectionDate)}`,
        pageW - margin,
        22,
        { align: 'right' }
      );

      let py = 56;
      const slotH = (pageH - FOOTER_H - 80) / 2;

      for (const photo of data.photos.slice(i, i + 2)) {
        const dataUrl = await loadImageAsDataUrl(photo.url);
        if (dataUrl) {
          const { w, h } = await getImageSize(dataUrl);
          if (w > 0 && h > 0) {
            const ratio = Math.min(contentW / w, (slotH - 22) / h);
            const dw = w * ratio;
            const dh = h * ratio;
            try {
              doc.addImage(dataUrl, detectFormat(dataUrl), margin + (contentW - dw) / 2, py, dw, dh);
            } catch {
              /* ignore */
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.4);
            doc.setTextColor(...TEXT);
            if (photo.caption) {
              doc.text(photo.caption, pageW / 2, py + dh + 13, { align: 'center', maxWidth: contentW });
            }
          }
        }
        py += slotH + 12;
      }
    }
  }

  // ---------- FOOTER BAND ON EVERY PAGE ----------
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const fy = pageH - FOOTER_H;
    doc.setFillColor(...DARK);
    doc.rect(0, fy, pageW, FOOTER_H, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, fy, pageW, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...GOLD);
    doc.text(`${(branding.companyName ?? '7 STARS FAMILY').toUpperCase()} STANDARD`, margin, fy + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(232, 230, 226);
    doc.text(doc.splitTextToSize(COMPANY_STANDARD_TEXT, contentW * 0.52) as string[], margin, fy + 32);

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.7);
    doc.line(margin + contentW * 0.58, fy + 10, margin + contentW * 0.58, fy + FOOTER_H - 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...GOLD);
    COMPANY_VALUES.forEach((v, i) => {
      doc.text(`★  ${v}`, margin + contentW * 0.62, fy + 15 + i * 8.4);
    });

    const contactBits = [branding.phone, branding.email, branding.website].filter(Boolean) as string[];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(200, 198, 194);
    if (contactBits.length > 0) {
      doc.text(contactBits.join('   •   '), pageW - margin, fy + FOOTER_H - 10, { align: 'right' });
    }
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, fy + 15, { align: 'right' });
  }

  const nameBit = (data.jobNumber || data.clientName || 'Inspection')
    .toString()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');
  const filename = `Final-Site-Inspection_${nameBit}_${data.inspectionDate}.pdf`;
  if (options?.output !== 'blob') doc.save(filename);
  return { blob: doc.output('blob') as Blob, filename };
};
