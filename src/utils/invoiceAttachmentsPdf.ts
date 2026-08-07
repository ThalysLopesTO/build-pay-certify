import { jsPDF } from 'jspdf';
import { isImageAttachment, formatFileSize } from '@/hooks/useInvoiceAttachments';

export interface AttachmentForPdf {
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size?: number | null;
}

export const isPdfAttachment = (att: AttachmentForPdf) =>
  (att.file_type || '').includes('pdf') || /\.pdf$/i.test(att.file_name);

// HTML snippet listing the attached files, rendered inside the invoice page.
// Photos and PDFs are additionally appended as extra pages after the invoice;
// other file types are noted as available online.
export const attachmentsSectionHtml = (attachments: AttachmentForPdf[] | undefined): string => {
  if (!attachments || attachments.length === 0) return '';

  const rows = attachments
    .map((att) => {
      const size = formatFileSize(att.file_size);
      const hint = isImageAttachment(att)
        ? 'photo — included on the following pages'
        : isPdfAttachment(att)
          ? 'document — included on the following pages'
          : 'file — available via your invoice link';
      return `
        <div style="padding:4px 0; font-size:12px; color:#374151;">
          &#128206; <span style="font-weight:600;">${att.file_name}</span>
          <span style="color:#9CA3AF;">${size ? ` (${size})` : ''} — ${hint}</span>
        </div>`;
    })
    .join('');

  return `
    <div style="background-color:#f9fafb; border:1px solid #e5e7eb; padding:14px 16px; border-radius:8px; margin-bottom:24px;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#9CA3AF; margin-bottom:6px;">
        Attachments (${attachments.length})
      </div>
      ${rows}
    </div>
  `;
};

// Load an image URL and normalize it to JPEG via canvas (jsPDF can't embed
// webp/some pngs reliably, and JPEG keeps the PDF small)
const loadImageAsJpeg = (
  url: string
): Promise<{ dataUrl: string; width: number; height: number } | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } catch (err) {
        console.warn('Could not convert attachment image for PDF:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

// Add one extra PDF page per photo attachment, image fitted with a caption.
// Works with any jsPDF unit (pt/mm) since spacing is derived from page width.
export const appendAttachmentImagePages = async (
  pdf: jsPDF,
  attachments: AttachmentForPdf[] | undefined
): Promise<void> => {
  if (!attachments || attachments.length === 0) return;

  const imageAttachments = attachments.filter(isImageAttachment);
  if (imageAttachments.length === 0) return;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = pageWidth * 0.07;
  const captionSpace = pageWidth * 0.06;

  for (const att of imageAttachments) {
    const image = await loadImageAsJpeg(att.file_url);
    if (!image) {
      console.warn('Skipping attachment image that failed to load:', att.file_name);
      continue;
    }

    pdf.addPage();

    // Caption at the top of the page
    pdf.setFontSize(11);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Attachment: ${att.file_name}`, margin, margin);

    // Fit the image inside the printable area below the caption
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2 - captionSpace;
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
    const drawWidth = image.width * ratio;
    const drawHeight = image.height * ratio;
    const x = (pageWidth - drawWidth) / 2;
    const y = margin + captionSpace;

    pdf.addImage(image.dataUrl, 'JPEG', x, y, drawWidth, drawHeight);
  }
};

// ---------------------------------------------------------------------------
// PDF attachments: merged as real pages after the invoice using pdf-lib
// ---------------------------------------------------------------------------

const fetchAttachmentBytes = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  } catch (err) {
    console.warn('Could not download attachment for PDF merge:', url, err);
    return null;
  }
};

// Merge every PDF attachment into the generated invoice PDF (invoice first,
// attachment pages after). Returns the merged bytes, or the original on failure.
export const mergePdfAttachments = async (
  invoicePdfBytes: ArrayBuffer,
  attachments: AttachmentForPdf[] | undefined
): Promise<Uint8Array> => {
  const pdfAttachments = (attachments || []).filter(isPdfAttachment);
  if (pdfAttachments.length === 0) return new Uint8Array(invoicePdfBytes);

  try {
    const { PDFDocument } = await import('pdf-lib');
    const merged = await PDFDocument.load(invoicePdfBytes);

    for (const att of pdfAttachments) {
      const bytes = await fetchAttachmentBytes(att.file_url);
      if (!bytes) continue;
      try {
        const donor = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(donor, donor.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      } catch (err) {
        console.warn('Skipping unreadable PDF attachment:', att.file_name, err);
      }
    }

    return await merged.save();
  } catch (err) {
    console.warn('PDF attachment merge failed, returning invoice only:', err);
    return new Uint8Array(invoicePdfBytes);
  }
};

// Finalize a jsPDF invoice: photo pages + merged PDF attachment pages -> Blob
export const buildInvoicePdfBlob = async (
  pdf: jsPDF,
  attachments: AttachmentForPdf[] | undefined
): Promise<Blob> => {
  await appendAttachmentImagePages(pdf, attachments);
  const baseBytes = pdf.output('arraybuffer');
  const mergedBytes = await mergePdfAttachments(baseBytes, attachments);
  return new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
};

// Same as buildInvoicePdfBlob, but triggers a browser download
export const saveInvoicePdfWithAttachments = async (
  pdf: jsPDF,
  attachments: AttachmentForPdf[] | undefined,
  filename: string
): Promise<void> => {
  const blob = await buildInvoicePdfBlob(pdf, attachments);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
