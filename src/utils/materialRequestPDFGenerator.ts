import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface Attachment {
  file_name: string;
  file_type: string;
  file_path: string;
}

interface MaterialRequest {
  jobsiteName: string;
  jobsiteAddress?: string;
  deliveryDate: string; // ISO string
  deliveryTime?: string;
  floorUnit?: string;
  materialList: string;
  submittedBy: string;
  submittedAt: string;
  attachments?: Attachment[];
}

interface CompanySettings {
  logoUrl?: string | null;
  companyName?: string;
}

export const generateMaterialRequestPDF = async (
  request: MaterialRequest,
  companySettings?: CompanySettings
) => {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header with company logo
  if (companySettings?.logoUrl) {
    try {
      const logo = await loadImageAsBase64(companySettings.logoUrl);
      doc.addImage(logo, "PNG", 15, 10, 40, 15);
    } catch (e) {
      console.error("Error loading logo:", e);
    }
  }

  doc.setFontSize(16);
  doc.text("Material Request", pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  // Jobsite & Request Info
  doc.setFontSize(11);
  doc.text(`Jobsite: ${request.jobsiteName}`, 15, yPos);
  if (request.jobsiteAddress) {
    doc.text(`Address: ${request.jobsiteAddress}`, 15, (yPos += 7));
  }
  doc.text(`Delivery Date: ${format(new Date(request.deliveryDate), "PPP")}`, 15, (yPos += 7));
  if (request.deliveryTime) doc.text(`Delivery Time: ${request.deliveryTime}`, 15, (yPos += 7));
  if (request.floorUnit) doc.text(`Floor/Unit: ${request.floorUnit}`, 15, (yPos += 7));

  doc.text(`Submitted By: ${request.submittedBy}`, 15, (yPos += 10));
  doc.text(`Submitted At: ${format(new Date(request.submittedAt), "PPP p")}`, 15, (yPos += 7));

  yPos += 10;

  // Material List
  autoTable(doc, {
    startY: yPos,
    head: [["Material List"]],
    body: request.materialList
      .split("\n")
      .filter(Boolean)
      .map((item) => [item]),
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Attachments (if any)
  if (request.attachments && request.attachments.length > 0) {
    doc.setFontSize(12);
    doc.text("Attachments:", 15, yPos);
    yPos += 5;

    for (const attachment of request.attachments) {
      if (attachment.file_type.startsWith("image/")) {
        try {
          const image = await loadImageAsBase64(attachment.file_path);
          doc.addImage(image, "JPEG", 15, yPos, 60, 45);
          doc.text(attachment.file_name, 80, yPos + 25);
          yPos += 55;
        } catch (err) {
          console.error(`Error loading image: ${attachment.file_name}`, err);
        }
      } else {
        doc.text(`📎 ${attachment.file_name}`, 15, yPos);
        yPos += 7;
      }

      // Add new page if space is too low
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
    }
  }

  doc.save(`${request.jobsiteName}_Material_Request.pdf`);
};

// Helper to load image as base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
