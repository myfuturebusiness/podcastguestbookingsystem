'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/brevo'
import { emailWrap } from '@/lib/email-templates'
import { getAppUrl } from '@/lib/app-url'

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return false

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`,
  })

  const data = await res.json()
  // Require score >= 0.5 (0.0 = bot, 1.0 = human)
  return data.success === true && data.score >= 0.5
}

export async function signUp(formData: FormData) {
  const recaptchaToken = formData.get('recaptcha_token') as string

  if (!recaptchaToken) {
    redirect(`/auth/signup?error=${encodeURIComponent('Bot check failed. Please try again.')}`)
  }

  const isHuman = await verifyRecaptcha(recaptchaToken)
  if (!isHuman) {
    redirect(`/auth/signup?error=${encodeURIComponent('Bot check failed. Please try again.')}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
        role: formData.get('role') as string,
      },
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)
  }

  // Send welcome email (best-effort — don't block signup if it fails)
  const email = formData.get('email') as string
  const fullName = (formData.get('full_name') as string) || 'there'
  const role = formData.get('role') as string
  const isHost = role === 'host'

  try {
    const htmlContent = emailWrap(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
        Welcome to Guest Booking System${fullName !== 'there' ? `, ${fullName}` : ''}!
      </h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        ${isHost
          ? "You've signed up as a <strong>Host</strong>. Once you confirm your email, you can set up your show profile, configure your availability, and start accepting guest bookings."
          : "You've signed up as a <strong>Guest</strong>. Once you confirm your email, you can browse available shows and apply to appear as a guest."}
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
        <strong>Next step:</strong> Check your inbox for a confirmation email and click the link to activate your account.
      </p>
      <a href="https://guestbookingsystem.com/" style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
        ${isHost ? 'Set up your show' : 'Browse shows'}
      </a>
      <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    `)

    await sendEmail({
      to: { email, name: fullName !== 'there' ? fullName : email },
      subject: `Welcome to Guest Booking System${fullName !== 'there' ? `, ${fullName}` : ''}!`,
      htmlContent,
    })
  } catch {
    // Non-fatal — user can still complete signup
  }

  if (data.session) {
    redirect('/dashboard')
  }

  redirect('/auth/signup?message=Check+your+email+to+confirm+your+account')
}
