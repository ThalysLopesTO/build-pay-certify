export interface EmailWrapperData {
  subject: string;
  bodyText: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogoUrl?: string;
}

export function createEmailWrapper({
  companyName,
  companyLogoUrl,
  companyAddress,
  companyPhone,
  bodyText,
}: Omit<EmailWrapperData, 'subject'>) {
  // Convert plain text to styled HTML paragraphs
  const paragraphs = bodyText
    .split(/\n+/)
    .map((p) => `<p style="margin: 0 0 14px 0;">${p.trim()}</p>`)
    .join("\n");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${companyName} Email</title>
  </head>
  <body style="background-color:#f8f9fb; font-family: Arial, sans-serif; padding: 30px 16px; color: #333;">
    <div style="max-width: 640px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      
      <!-- ✅ Logo (always centered) -->
      ${
        companyLogoUrl
          ? `<div style="text-align:center; margin-bottom:12px;">
              <img src="${companyLogoUrl}" alt="${companyName} Logo" style="max-width: 160px; max-height: 60px;" />
            </div>`
          : ""
      }

      <!-- ✅ Company Name (always visible, even if logo exists) -->
      <h2 style="text-align:center; margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #222;">
        ${companyName}
      </h2>

      <!-- ✅ Main body text -->
      <div style="font-size: 15px; line-height: 1.6; color: #444;">
        ${paragraphs}
      </div>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />

      <!-- ✅ Footer -->
      <footer style="font-size: 12px; color: #888; text-align: center;">
        ${
          companyAddress || companyPhone
            ? `<div style="margin-bottom:4px;">${companyAddress || ""}${
                companyAddress && companyPhone ? " | " : ""
              }${companyPhone || ""}</div>`
            : ""
        }
        <div style="font-size: 11px; color: #aaa;">
          This email was sent by ${companyName} via StackBuild.
        </div>
      </footer>
    </div>
  </body>
  </html>
  `;
}

// ✅ Backward compatibility alias
export const wrapEmailHTML = createEmailWrapper;
