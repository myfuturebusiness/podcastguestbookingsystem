'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/brevo'
import { emailWrap } from '@/lib/email-templates'
import { formatInTimezone } from '@/lib/availability'
import { fireWebhooks } from '@/lib/webhooks'
import { getAppUrl } from '@/lib/app-url'

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$'
  const all = upper + lower + digits + special
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ]
  const rest = Array.from({ length: 9 }, () => all[Math.floor(Math.random() * all.length)])
  const combined = [...required, ...rest]
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }
  return combined.join('')
}

export async function confirmSlot(formData: FormData) {
  const podcastId = formData.get('podcast_id') as string
  const applicationId = formData.get('application_id') as string
  const slotStartTime = formData.get('slot_start_time') as string
  const slotEndTime = formData.get('slot_end_time') as string
  const guestTimezone = (formData.get('guest_timezone') as string) || 'UTC'
  const isReschedule = formData.get('reschedule') === '1'

  if (!slotStartTime) {
    redirect(`/book/${podcastId}/slots?app=${applicationId}&error=Please+select+a+time+slot`)
  }

  const adminSupabase = createAdminClient()

  const { data: application } = await adminSupabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (!application) redirect(`/book/${podcastId}`)
  if (application.status === 'confirmed') {
    redirect(`/book/${podcastId}/thankyou?app=${applicationId}`)
  }

  const supabase = createClient()
  const { data: podcast } = await supabase.from('podcasts').select('title, host_id').eq('id', podcastId).single()
  const slot = slotStartTime && slotEndTime
    ? { start_time: slotStartTime, end_time: slotEndTime }
    : null

  // Check if a profile already exists for this email
  const { data: existingProfile } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('email', application.email)
    .maybeSingle()

  let userId: string
  let tempPassword: string | null = null
  let isNewUser = false

  if (existingProfile) {
    userId = existingProfile.id
  } else {
    tempPassword = generateTempPassword()
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: application.email,
      password: tempPassword,
      email_confirm: true,
    })

    if (createError || !newUser.user) {
      redirect(
        `/book/${podcastId}/slots?app=${applicationId}&error=Unable+to+create+your+account.+Please+contact+us.`
      )
    }

    userId = newUser.user.id
    isNewUser = true

    await adminSupabase.from('profiles').insert({
      id: userId,
      role: 'guest',
      full_name: `${application.first_name} ${application.last_name}`,
      email: application.email,
      website_url: application.website ?? null,
      bio: application.bio_text ?? null,
      social_links: {
        twitter: application.twitter ?? null,
        linkedin: application.linkedin ?? null,
        facebook: application.facebook ?? null,
        instagram: application.instagram ?? null,
      },
    })
  }

  // Create booking request
  const { data: bookingRequest, error: bookingError } = await adminSupabase
    .from('booking_requests')
    .insert({
      podcast_id: podcastId,
      guest_id: userId,
      slot_start_time: slotStartTime,
      slot_end_time: slotEndTime,
      guest_timezone: guestTimezone,
      status: 'pending',
      topic: application.topic,
    })
    .select('id')
    .single()

  if (bookingError) {
    redirect(
      `/book/${podcastId}/slots?app=${applicationId}&error=Could+not+confirm+your+booking.+Please+try+again.`
    )
  }

  // Mark application confirmed
  await adminSupabase
    .from('applications')
    .update({
      status: 'confirmed',
      booking_request_id: bookingRequest.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  // Fire booking confirmed webhook in background
  fireWebhooks('booking.confirmed', {
    booking_request_id: bookingRequest.id,
    application_id: applicationId,
    podcast_id: podcastId,
    guest_email: application.email,
    guest_name: `${application.first_name} ${application.last_name}`,
    slot_start_time: slotStartTime,
    slot_end_time: slotEndTime,
    guest_timezone: guestTimezone,
    topic: application.topic,
    is_reschedule: isReschedule,
  }).catch(() => {})

  // Send confirmation email immediately — host approval is internal only
  if (slot && podcast) {
    // Format times in the guest's local timezone so the email is correct for them
    const guestSlotFormatted = formatInTimezone(slot.start_time, guestTimezone)
    const guestSlotEnd = formatInTimezone(slot.end_time, guestTimezone, {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    const slotDate = guestSlotFormatted
    void guestSlotEnd
    const appUrl = getAppUrl()

    const credentialsBlock =
      isNewUser && tempPassword
        ? `
          <div style="background:#f0f4ff;border-radius:8px;padding:16px 20px;margin:24px 0;border:1px solid #c7d2fe;">
            <p style="margin:0 0 8px;font-weight:600;color:#1e1e1e;">Your Guest Account Login</p>
            <p style="margin:0;font-size:14px;color:#333;line-height:1.8;">
              <strong>Login page:</strong> <a href="${appUrl}/auth/signin" style="color:#4f46e5;">${appUrl}/auth/signin</a><br/>
              <strong>Email:</strong> ${application.email}<br/>
              <strong>Temporary password:</strong> <code style="background:#e0e7ff;padding:2px 8px;border-radius:4px;font-size:13px;">${tempPassword}</code>
            </p>
            <p style="margin:12px 0 0;font-size:13px;color:#555;">Please log in and change your password at your earliest convenience.</p>
          </div>
        `
        : `<p>You can manage your booking by logging in to your existing account at <a href="${appUrl}/auth/signin" style="color:#4f46e5;">${appUrl}/auth/signin</a>.</p>`

    const html = emailWrap(isReschedule ? `
  <h1 style="color:#4f46e5;margin-bottom:4px;">Your Interview Has Been Rescheduled</h1>
  <p style="color:#555;margin-top:0;">Hi ${application.first_name}, your new interview time is confirmed.</p>

  <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin:24px 0;border-left:4px solid #4f46e5;">
    <p style="margin:0 0 4px;font-weight:600;font-size:16px;">${podcast.title}</p>
    <p style="margin:0;font-size:15px;color:#333;">${slotDate}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#777;">Times shown in your local timezone (${guestTimezone})</p>
  </div>

  ${credentialsBlock}

  <p style="color:#555;">Please add this new time to your calendar. All other details remain the same.</p>
  <p style="margin-top:32px;color:#555;">We look forward to speaking with you!</p>
  <p style="color:#555;"><strong>The ${podcast?.title ?? 'Guest Booking System'} Team</strong></p>` : `
  <h1 style="color:#4f46e5;margin-bottom:4px;">Your Interview is Confirmed!</h1>
  <p style="color:#555;margin-top:0;">Thank you for your application, ${application.first_name}.</p>

  <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin:24px 0;border-left:4px solid #4f46e5;">
    <p style="margin:0 0 4px;font-weight:600;font-size:16px;">${podcast.title}</p>
    <p style="margin:0;font-size:15px;color:#333;">${slotDate}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#777;">Times shown in your local timezone (${guestTimezone})</p>
  </div>

  ${credentialsBlock}

  <h2 style="color:#4f46e5;margin-top:32px;">How to Prepare for Your Interview</h2>
  <ul style="line-height:2;color:#333;padding-left:20px;">
    <li><strong>NO WIFI</strong> — Use a hard-wired internet connection. WiFi can cause choppy audio.</li>
    <li>Find a quiet room. Close doors and windows. Turn off nearby devices.</li>
    <li>Check your audio, video, and lighting <em>at least 10 minutes</em> before the call.</li>
    <li>Wear headphones to prevent audio feedback (your voice echoing back).</li>
    <li>Do <strong>not</strong> record the call yourself — we handle the recording.</li>
  </ul>

  <p style="margin-top:32px;color:#555;">We look forward to having you on the show!</p>
  <p style="color:#555;"><strong>The ${podcast?.title ?? 'Guest Booking System'} Team</strong></p>`)

    try {
      await sendEmail({
        to: {
          email: application.email,
          name: `${application.first_name} ${application.last_name}`,
        },
        subject: isReschedule
            ? `Your interview has been rescheduled — ${podcast.title}`
            : `Your interview is confirmed — ${podcast.title}`,
        htmlContent: html,
      })
    } catch (e) {
      console.error('Failed to send confirmation email:', e)
    }

    // Notify the host of the new application
    const podcastTyped = podcast as unknown as { title: string; host_id: string }
    if (podcastTyped.host_id) {
      const { data: hostProfile } = await adminSupabase
        .from('profiles')
        .select('email, full_name, timezone')
        .eq('id', podcastTyped.host_id)
        .single()

      if (hostProfile?.email) {
        const hostTimezone =
          (hostProfile as unknown as { timezone?: string }).timezone ?? 'UTC'
        const hostSlotFormatted = formatInTimezone(slot.start_time, hostTimezone)
        const appUrl = getAppUrl()

        const hostHtml = emailWrap(`
  <h1 style="color:#4f46e5;margin-bottom:4px;">New Application to Review</h1>
  <p style="color:#555;margin-top:0;">
    <strong>${application.first_name} ${application.last_name}</strong> has applied to appear on
    <strong>${podcast.title}</strong> and selected a time slot.
  </p>

  <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin:24px 0;border-left:4px solid #4f46e5;">
    <p style="margin:0 0 8px;font-weight:600;font-size:16px;">${application.first_name} ${application.last_name}</p>
    <p style="margin:0;font-size:14px;color:#555;line-height:2;">
      <strong>Email:</strong> ${application.email}<br/>
      <strong>Topic:</strong> ${application.topic}<br/>
      <strong>Format:</strong> ${application.interview_format_label ?? application.interview_format ?? '—'}<br/>
      <strong>Proposed slot:</strong> ${hostSlotFormatted} (${hostTimezone})
    </p>
  </div>

  <p style="color:#555;">Log in to your dashboard to review and approve or reject this application.</p>

  <a href="${appUrl}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px;">
    Review Application →
  </a>

  <p style="margin-top:32px;color:#999;font-size:13px;">
    You received this because you host <strong>${podcast.title}</strong>.
  </p>`)

        try {
          await sendEmail({
            to: {
              email: hostProfile.email,
              name: hostProfile.full_name ?? 'Host',
            },
            subject: `New application from ${application.first_name} ${application.last_name} — ${podcast.title}`,
            htmlContent: hostHtml,
          })
        } catch (e) {
          console.error('Failed to send host notification email:', e)
        }
      }
    }
  }

  redirect(`/book/${podcastId}/thankyou?app=${applicationId}`)
}
