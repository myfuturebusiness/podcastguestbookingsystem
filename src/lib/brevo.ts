const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

interface SendEmailParams {
  to: { email: string; name?: string } | { email: string; name?: string }[]
  subject: string
  htmlContent: string
}

export async function sendEmail(params: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('BREVO_API_KEY not set — skipping email')
    return
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Guest Booking System',
        email: process.env.BREVO_FROM_EMAIL ?? 'noreply@guestbookingsystem.com',
      },
      to: Array.isArray(params.to) ? params.to : [params.to],
      replyTo: { email: 'support@guestbookingsystem.com', name: 'Guest Booking System Support' },
      subject: params.subject,
      htmlContent: params.htmlContent,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo send failed:', err)
  }
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://guestbookingsystem.com'

// Inline logo — table-based for email client compatibility
const emailLogo = () => `
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px auto;">
    <tr>
      <td style="width:32px;height:32px;background:#4f46e5;border-radius:8px;text-align:center;vertical-align:middle;">
        <span style="color:#ffffff;font-size:18px;line-height:32px;display:block;">🎙</span>
      </td>
      <td style="padding-left:10px;vertical-align:middle;">
        <span style="color:#ffffff;font-weight:700;font-size:18px;letter-spacing:-0.3px;white-space:nowrap;">Guest Booking System</span>
      </td>
    </tr>
  </table>`

// Step circle — line-height centering instead of flex (Outlook compatible)
const stepCircle = (n: number, color: string, border: string) =>
  `<td style="width:24px;height:24px;border-radius:50%;background:${color};border:1px solid ${border};text-align:center;vertical-align:middle;padding:0;">
    <span style="color:${border};font-size:11px;font-weight:700;line-height:24px;display:block;">${n}</span>
  </td>`

// ── Host welcome emails ──────────────────────────────────────────────────────

export async function sendFoundingMemberWelcome(to: { email: string; name: string }) {
  await sendEmail({
    to: [to],
    subject: "You're a Founding Member — Welcome to Guest Booking System!",
    htmlContent: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#111827;color:#f9fafb;padding:40px 32px;border-radius:16px;">
        ${emailLogo()}
        <div style="text-align:center;margin-bottom:24px;">
          <span style="display:inline-block;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:6px 16px;border-radius:999px;">🎙 Founding Member</span>
        </div>
        <h1 style="font-size:26px;font-weight:800;color:#ffffff;text-align:center;margin:0 0 12px;line-height:1.3;">You're in. Forever.</h1>
        <p style="color:#9ca3af;text-align:center;margin:0 0 8px;line-height:1.6;">Hi ${to.name}, welcome to the Guest Booking System as a Founding Member.</p>
        <p style="color:#9ca3af;text-align:center;margin:0 0 32px;line-height:1.6;">You've secured <strong style="color:#a5b4fc;">lifetime access</strong> at today's price — it will never increase for you, no matter what we charge in the future.</p>
        <div style="background:#1f2937;border-radius:12px;padding:24px;margin-bottom:32px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;margin:0 0 16px;">Your next steps</p>
          ${['Create your show profile — add your name, description and availability', 'Set your booking fee (optional — keep it free if you prefer)', 'Share your booking link and start accepting guests'].map((step, i) => `
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;width:100%;">
              <tr>
                ${stepCircle(i + 1, 'rgba(99,102,241,0.2)', '#818cf8')}
                <td style="padding-left:12px;color:#d1d5db;font-size:14px;line-height:1.5;vertical-align:middle;">${step}</td>
              </tr>
            </table>
          `).join('')}
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${appUrl()}/dashboard/podcast/new" style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">Create Your First Show →</a>
        </div>
        <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">Questions? Reply to this email — we're here to help.</p>
      </div>
    `,
  })
}

export async function sendMonthlyWelcome(to: { email: string; name: string }) {
  await sendEmail({
    to: [to],
    subject: 'Welcome to Guest Booking System — Your Host Account is Active!',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#111827;color:#f9fafb;padding:40px 32px;border-radius:16px;">
        ${emailLogo()}
        <h1 style="font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin:0 0 12px;line-height:1.3;">Welcome To Your<br>Guest Booking System!</h1>
        <p style="color:#9ca3af;text-align:center;margin:0 0 8px;line-height:1.6;">Hi ${to.name}, your Host account is active and ready to go.</p>
        <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 32px;line-height:1.6;">Renews monthly — cancel any time from your account settings.</p>
        <div style="background:#1f2937;border-radius:12px;padding:24px;margin-bottom:32px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;margin:0 0 16px;">Get started in 3 steps</p>
          ${['Create your show profile', 'Set your availability and booking link', 'Share your link and start accepting guests'].map((step, i) => `
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;width:100%;">
              <tr>
                ${stepCircle(i + 1, 'rgba(99,102,241,0.2)', '#818cf8')}
                <td style="padding-left:12px;color:#d1d5db;font-size:14px;line-height:1.5;vertical-align:middle;">${step}</td>
              </tr>
            </table>
          `).join('')}
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${appUrl()}/dashboard/podcast/new" style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">Create Your First Show →</a>
        </div>
        <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">Questions? Reply to this email — we're here to help.</p>
      </div>
    `,
  })
}

// ── Admin notification ───────────────────────────────────────────────────────

export async function sendAdminNewHostNotification(host: {
  name: string
  email: string
  plan: 'founding' | 'monthly'
  paymentMethod: 'stripe' | 'paypal'
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) return

  const planLabel = host.plan === 'founding' ? '🎙 Founding Member ($297 lifetime)' : '📅 Monthly Host ($47/month)'

  await sendEmail({
    to: [{ email: adminEmail, name: 'Rick Nuske' }],
    subject: `🎉 New Host Signup: ${host.name}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#111827;color:#f9fafb;padding:40px 32px;border-radius:16px;">
        ${emailLogo()}
        <h2 style="color:#ffffff;margin:0 0 24px;font-size:22px;text-align:center;line-height:1.3;">New Host Signed Up 🎉</h2>
        <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:32px;">
          ${[['Name', host.name], ['Email', host.email], ['Plan', planLabel], ['Payment via', host.paymentMethod === 'stripe' ? 'Stripe' : 'PayPal']].map(([label, value]) => `
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-bottom:1px solid #374151;">
              <tr>
                <td style="color:#6b7280;font-size:13px;padding:10px 0;vertical-align:middle;">${label}</td>
                <td style="color:#f9fafb;font-size:13px;font-weight:600;padding:10px 0;text-align:right;vertical-align:middle;">${value}</td>
              </tr>
            </table>
          `).join('')}
        </div>
        <div style="text-align:center;">
          <a href="${appUrl()}/admin" style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">View in Admin Panel →</a>
        </div>
      </div>
    `,
  })
}
