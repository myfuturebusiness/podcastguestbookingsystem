/**
 * Shared email template helpers.
 * All emails use these building blocks so the brand stays consistent.
 */

const FONT = `Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`
const SITE_URL = `https://guestbookingsystem.com/`

/** Indigo logo header linked to the website — place at the top of every email body */
export function emailLogo(): string {
  return `
  <div style="text-align:center;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid #e5e7eb;">
    <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;">
      <p style="margin:0;font-family:${FONT};font-size:22px;font-weight:900;color:#4f46e5;letter-spacing:-0.4px;line-height:1.2;">
        Guest Booking System
      </p>
      <p style="margin:4px 0 0;font-family:${FONT};font-size:9px;font-weight:600;color:#9ca3af;letter-spacing:0.14em;text-transform:uppercase;">
        Powered by My Future Business
      </p>
    </a>
  </div>`
}

/** Standard outer wrapper — sets font, max-width, background */
export function emailWrap(bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:${FONT};max-width:600px;margin:0 auto;padding:32px 24px;color:#1e1e1e;background:#fff;">
  ${emailLogo()}
  ${bodyContent}
</body>
</html>`
}
