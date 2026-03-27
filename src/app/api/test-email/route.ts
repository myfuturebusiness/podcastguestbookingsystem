import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL

  if (!apiKey) return NextResponse.json({ error: 'BREVO_API_KEY not set' }, { status: 500 })

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Guest Booking System', email: fromEmail },
      to: [{ email: 'support@guestbookingsystem.com', name: 'Rick Nuske' }],
      subject: 'Test email from Guest Booking System',
      htmlContent: '<p>This is a test email to confirm Brevo is working.</p>',
    }),
  })

  const text = await res.text()
  return NextResponse.json({ status: res.status, body: text })
}
