import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MaterialRequest } from '@/components/admin/types/materialRequest';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { formatDate } from '@/utils/formatters';

interface MaterialRequestAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
}

export const generateMaterialRequestPDF = async (
  request: MaterialRequest & { submitted_by_name?: string },
  companySettings?: CompanySettings | null,
  logoUrl?: string | null,
  attachments: MaterialRequestAttachment[] = []
): Promise<void> => {
  // Create temporary container for HTML content
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  document.body.appendChild(container);

  try {
    // Generate HTML content
    const htmlContent = await generateMaterialRequestHTML(request, companySettings, logoUrl, attachments);
    container.innerHTML = htmlContent;

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: container.scrollHeight
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const jobsiteName = request.jobsites?.name || 'Unknown_Jobsite';
    const deliveryDate = new Date(request.delivery_date).toISOString().split('T')[0];
    const filename = `Material_Request_${jobsiteName.replace(/[^a-zA-Z0-9]/g, '_')}_${deliveryDate}.pdf`;

    // Download PDF
    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

const generateMaterialRequestHTML = async (
  request: MaterialRequest & { submitted_by_name?: string },
  companySettings?: CompanySettings | null,
  logoUrl?: string | null,
  attachments: MaterialRequestAttachment[] = []
): Promise<string> => {
  const formatUserDisplay = (userId: string | null, userName?: string) => {
    if (!userId) return 'Former Employee';
    if (userName && userName.trim()) return userName;
    return `User ${userId.substring(0, 8)}...`;
  };

  // Load images as base64 if they exist
  let logoBase64 = '';
  if (logoUrl) {
    try {
      logoBase64 = await getImageAsBase64(logoUrl);
    } catch (error) {
      console.warn('Could not load logo for PDF:', error);
    }
  }

  // Load attachment images as base64
  const attachmentImages: string[] = [];
  for (const attachment of attachments) {
    if (attachment.file_type.startsWith('image/')) {
      try {
        const imageUrl = `https://qsqjwpajvcmahoamwwww.supabase.co/storage/v1/object/public/material-request-attachments/${attachment.file_path}`;
        const base64 = await getImageAsBase64(imageUrl);
        attachmentImages.push(base64);
      } catch (error) {
        console.warn('Could not load attachment image:', error);
      }
    }
  }

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" style="height: 60px; max-width: 120px; object-fit: contain;">` : ''}
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #1f2937;">Material Request</h1>
            ${companySettings?.company_name ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 16px;">${companySettings.company_name}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Request Date</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${formatDate(request.created_at)}</p>
        </div>
      </div>

      <!-- Request Details -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Request Information</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Request ID</h3>
            <p style="font-size: 14px; font-family: monospace; margin: 0; color: #374151;">${request.id}</p>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Status</h3>
            <p style="font-size: 14px; margin: 0; color: #374151; text-transform: capitalize;">${request.status}</p>
          </div>
        </div>
      </div>

      <!-- Jobsite Information -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Jobsite Information</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Jobsite Name</h3>
            <p style="font-size: 16px; margin: 0; color: #374151; font-weight: 600;">${request.jobsites?.name || 'Unknown Jobsite'}</p>
          </div>
          
          ${request.jobsites?.address ? `
            <div style="margin-bottom: 15px;">
              <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Address</h3>
              <p style="font-size: 14px; margin: 0; color: #374151;">${request.jobsites.address}</p>
            </div>
          ` : ''}
          
          ${request.floor_unit ? `
            <div>
              <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Floor/Unit</h3>
              <p style="font-size: 14px; margin: 0; color: #374151;">${request.floor_unit}</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Delivery Information -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Delivery Information</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Delivery Date</h3>
            <p style="font-size: 16px; margin: 0; color: #374151; font-weight: 600;">${formatDate(request.delivery_date)}</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Delivery Time</h3>
            <p style="font-size: 16px; margin: 0; color: #374151; font-weight: 600;">${request.delivery_time}</p>
          </div>
        </div>
      </div>

      <!-- Submitted By -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Submitted By</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Employee</h3>
            <p style="font-size: 16px; margin: 0; color: #374151; font-weight: 600;">${formatUserDisplay(request.submitted_by, request.submitted_by_name)}</p>
          </div>
          
          <div>
            <h3 style="font-size: 14px; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase;">Submission Date</h3>
            <p style="font-size: 14px; margin: 0; color: #374151;">${new Date(request.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>

      <!-- Material List -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Material List</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; margin: 0; color: #374151;">${request.material_list}</pre>
        </div>
      </div>

      <!-- Attachments -->
      ${attachmentImages.length > 0 ? `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Attached Images</h2>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            ${attachmentImages.map((image, index) => `
              <div style="text-align: center;">
                <img src="${image}" alt="Attachment ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Attachment ${index + 1}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        ${companySettings?.company_name ? `
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">
            ${companySettings.company_name}
          </p>
        ` : ''}
      </div>
    </div>
  `;
};

const getImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
};