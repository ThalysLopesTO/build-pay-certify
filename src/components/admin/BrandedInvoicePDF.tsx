import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadInvoicePDF = async (status: 'PAID' | 'DRAFT' = 'PAID') => {
  const invoiceElement = document.getElementById('invoice-preview');
  if (!invoiceElement) return;

  // Add watermark dynamically
  const watermark = document.createElement('div');
  watermark.innerText = status;
  watermark.style.position = 'absolute';
  watermark.style.top = '40%';
  watermark.style.left = '50%';
  watermark.style.transform = 'translate(-50%, -50%)';
  watermark.style.fontSize = '100px';
  watermark.style.color = 'rgba(200,200,200,0.2)';
  watermark.style.zIndex = '9999';
  watermark.style.pointerEvents = 'none';
  watermark.style.fontWeight = 'bold';
  watermark.style.userSelect = 'none';
  invoiceElement.appendChild(watermark);

  // Create canvas and convert to image
  const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true, // to load logo images
    allowTaint: true
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save('invoice.pdf');

  // Cleanup watermark
  invoiceElement.removeChild(watermark);
};
