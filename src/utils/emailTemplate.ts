export function wrapEmailHTML({ companyName, companyLogoUrl, companyFooter, bodyText }: { companyName: string; companyLogoUrl?: string; companyFooter?: string; bodyText: string }) {
  const paragraphs = bodyText
    .split(/\n+/)
    .map(p => `<p style="margin: 0 0 14px 0;">${p.trim()}</p>`)
    .join("\n")

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
      
      ${
        companyLogoUrl
          ? `<div style="text-align:center; margin-bottom:24px;">
              <img src="${companyLogoUrl}" alt="${companyName} Logo" style="max-width: 160px; max-height: 60px;" />
            </div>`
          : `<h2 style="text-align:center; margin-bottom:24px;">${companyName}</h2>`
      }

      <div style="font-size: 15px; line-height: 1.6;">
        ${paragraphs}
      </div>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #ddd;" />

      <footer style="font-size: 12px; color: #888; text-align: center;">
        ${companyFooter || `This email was sent by ${companyName} via StackBuild.`}
      </footer>
    </div>
  </body>
  </html>
  `
}
