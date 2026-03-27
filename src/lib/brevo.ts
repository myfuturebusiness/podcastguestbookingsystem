const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

interface SendEmailParams {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
}

async function sendEmail(params: SendEmailParams) {
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
        name: process.env.BREVO_SENDER_NAME ?? 'Guest Booking System',
        email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@guestbookingsystem.com',
      },
      to: params.to,
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
const logoUrl = () => `${appUrl()}/gbs%20logo%20white.png`

// ── Host welcome emails ──────────────────────────────────────────────────────

export async function sendFoundingMemberWelcome(to: { email: string; name: string }) {
  await sendEmail({
    to: [to],
    subject: "⚡ You're a Founding Member — Welcome to Guest Booking System!",
    htmlContent: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#111827;color:#f9fafb;padding:40px 32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <img src="${logoUrl()}" alt="Guest Booking System" style="height:48px;object-fit:contain;" />
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <span style="display:inline-block;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.4);color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:6px 16px;border-radius:999px;">⚡ Founding Member</span>
        </div>
        <h1 style="font-size:26px;font-weight:800;color:#ffffff;text-align:center;margin:0 0 12px;">You're in. Forever.</h1>
        <p style="color:#9ca3af;text-align:center;margin:0 0 8px;line-height:1.6;">Hi ${to.name}, welcome to the Guest Booking System as a Founding Member.</p>
        <p style="color:#9ca3af;text-align:center;margin:0 0 32px;line-height:1.6;">You've secured <strong style="color:#fbbf24;">lifetime access</strong> at today's price — it will never increase for you, no matter what we charge in the future.</p>
        <div style="background:#1f2937;border-radius:12px;padding:24px;margin-bottom:32px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;margin:0 0 16px;">Your next steps</p>
          ${['Create your show profile — add your name, description and availability', 'Set your booking fee (optional — keep it free if you prefer)', 'Share your booking link and start accepting guests'].map((step, i) => `
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
              <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(251,191,36,0.2);border:1px solid rgba(251,191,36,0.4);color:#fbbf24;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;">${i + 1}</span>
              <span style="color:#d1d5db;font-size:14px;line-height:1.5;">${step}</span>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${appUrl()}/dashboard/podcast/new" style="display:inline-block;background:#fbbf24;color:#78350f;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">Create Your First Show →</a>
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
        <div style="text-align:center;margin-bottom:32px;">
          <img src="${logoUrl()}" alt="Guest Booking System" style="height:48px;object-fit:contain;" />
        </div>
        <h1 style="font-size:26px;font-weight:800;color:#ffffff;text-align:center;margin:0 0 12px;">Welcome To The Guest Booking System!</h1>
        <p style="color:#9ca3af;text-align:center;margin:0 0 8px;line-height:1.6;">Hi ${to.name}, your Host account is active and ready to go.</p>
        <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 32px;">Renews monthly — cancel any time from your account settings.</p>
        <div style="background:#1f2937;border-radius:12px;padding:24px;margin-bottom:32px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;margin:0 0 16px;">Get started in 3 steps</p>
          ${['Create your show profile', 'Set your availability', 'Share your booking link'].map((step, i) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
              <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);color:#818cf8;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;">${i + 1}</span>
              <span style="color:#d1d5db;font-size:14px;">${step}</span>
            </div>
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

  const planLabel = host.plan === 'founding' ? '⚡ Founding Member ($297 lifetime)' : '📅 Monthly Host ($47/month)'

  await sendEmail({
    to: [{ email: adminEmail, name: 'Rick Nuske' }],
    subject: `🎉 New Host Signup: ${host.name}`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#111827;color:#f9fafb;padding:32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="${logoUrl()}" alt="Guest Booking System" style="height:40px;object-fit:contain;" />
        </div>
        <h2 style="color:#ffffff;margin:0 0 24px;font-size:20px;text-align:center;">New Host Signed Up 🎉</h2>
        <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:24px;">
          ${[['Name', host.name], ['Email', host.email], ['Plan', planLabel], ['Payment via', host.paymentMethod === 'stripe' ? 'Stripe' : 'PayPal']].map(([label, value]) => `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #374151;">
              <span style="color:#6b7280;font-size:13px;">${label}</span>
              <span style="color:#f9fafb;font-size:13px;font-weight:600;">${value}</span>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;">
          <a href="${appUrl()}/admin" style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;padding:12px 24px;border-radius:10px;">View in Admin Panel →</a>
        </div>
      </div>
    `,
  })
}
