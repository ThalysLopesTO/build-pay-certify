interface SiteInspectionEmailData {
  clientName?: string | null;
  companyName: string;
  companyLogoUrl?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  inspectionDate: string;
  propertyAddress?: string | null;
  jobNumber?: string | null;
  claimNumber?: string | null;
  supervisor?: string | null;
  itemsChecked?: string | null;
  customMessage?: string | null;
}

const row = (label: string, value?: string | null) =>
  value
    ? `<div style="display:table-row;">
        <div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px;">${label}</div>
        <div style="display:table-cell;padding:8px 0;text-align:right;color:#1f2937;font-weight:600;font-size:14px;">${value}</div>
      </div>`
    : '';

export const createSiteInspectionEmailHTML = (data: SiteInspectionEmailData): string => {
  const {
    clientName,
    companyName,
    companyLogoUrl,
    companyPhone,
    companyEmail,
    inspectionDate,
    propertyAddress,
    jobNumber,
    claimNumber,
    supervisor,
    itemsChecked,
    customMessage,
  } = data;

  const prettyDate = (() => {
    const d = new Date(`${inspectionDate}T12:00:00`);
    return Number.isNaN(d.getTime())
      ? inspectionDate
      : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Site Inspection Report from ${companyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">

    <!-- Header -->
    <div style="text-align:center;padding:36px 20px 24px 20px;background:linear-gradient(135deg,#1c1a17 0%,#332f28 100%);">
      ${
        companyLogoUrl
          ? `<div style="display:inline-block;background:#ffffff;border-radius:8px;padding:10px 14px;margin-bottom:18px;">
               <img src="${companyLogoUrl}" alt="${companyName}" style="max-width:160px;max-height:56px;display:block;" />
             </div>`
          : ''
      }
      <h1 style="color:#c9a227;font-size:24px;font-weight:700;margin:0;letter-spacing:0.5px;">FINAL SITE INSPECTION</h1>
      <p style="color:#e8e6e2;font-size:13px;margin:8px 0 0 0;">${prettyDate}</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 30px;">
      <p style="font-size:16px;color:#1f2937;line-height:1.6;margin:0 0 18px 0;">
        Hi ${clientName || 'there'},
      </p>
      <p style="font-size:16px;color:#1f2937;line-height:1.6;margin:0 0 18px 0;">
        Your final site inspection has been completed by our team. The signed report is attached
        to this email as a PDF for your records.
      </p>

      ${
        customMessage
          ? `<div style="background-color:#fdf8e7;border-left:4px solid #c9a227;padding:15px;margin:20px 0;border-radius:4px;">
               <p style="font-size:14px;color:#5b4a12;margin:0;line-height:1.5;">${customMessage}</p>
             </div>`
          : ''
      }

      <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:28px 0;">
        <div style="display:table;width:100%;border-spacing:0;">
          ${row('Inspection Date', prettyDate)}
          ${row('Property Address', propertyAddress)}
          ${row('Job #', jobNumber)}
          ${row('Claim #', claimNumber)}
          ${row('Supervisor', supervisor)}
          ${row('Checklist Completed', itemsChecked)}
        </div>
      </div>

      <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0;">
        If you have any questions about this inspection, simply reply to this email and our team
        will be happy to help.
      </p>

      <p style="font-size:15px;color:#1f2937;line-height:1.6;margin:24px 0 0 0;">
        Thank you,<br /><strong>${companyName}</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:12px;color:#8b8781;padding:22px;background-color:#1c1a17;">
      <div style="color:#c9a227;font-weight:700;letter-spacing:1px;margin-bottom:6px;">${companyName.toUpperCase()}</div>
      ${[companyPhone, companyEmail].filter(Boolean).join(' &nbsp;•&nbsp; ')}
    </div>
  </div>
</body>
</html>
  `;
};
