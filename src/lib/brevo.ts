export interface BrevoEmailOptions {
  to: { email: string; name: string }
  subject: string
  htmlContent: string
}

export async function sendEmail(options: BrevoEmailOptions): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Guest Booking System',
        email: process.env.BREVO_FROM_EMAIL!,
      },
      to: [options.to],
      subject: options.subject,
      htmlContent: options.htmlContent,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Brevo error:', text)
    throw new Error(`Brevo API error: ${res.status}`)
  }
}
