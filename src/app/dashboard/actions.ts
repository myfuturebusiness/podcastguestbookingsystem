'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/brevo'
import { emailWrap } from '@/lib/email-templates'
import { formatInTimezone } from '@/lib/availability'

async function getHostPodcastIds(hostId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('podcasts')
    .select('id')
    .eq('host_id', hostId)
  return (data ?? []).map((p) => p.id)
}

export async function approveBooking(bookingRequestId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcastIds = await getHostPodcastIds(user.id)
  const adminSupabase = createAdminClient()

  const { data: br } = await adminSupabase
    .from('booking_requests')
    .select('id, podcast_id, status, slot_start_time, slot_end_time, guest_timezone')
    .eq('id', bookingRequestId)
    .single()

  if (!br || !podcastIds.includes(br.podcast_id)) redirect('/dashboard')

  await adminSupabase
    .from('booking_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', bookingRequestId)

  // Fetch application and podcast for the email
  const [{ data: application }, { data: podcast }] = await Promise.all([
    adminSupabase
      .from('applications')
      .select('email, first_name, last_name')
      .eq('booking_request_id', bookingRequestId)
      .maybeSingle(),
    adminSupabase
      .from('podcasts')
      .select('title')
      .eq('id', br.podcast_id)
      .single(),
  ])

  if (application?.email) {
    const brTyped = br as unknown as { slot_start_time?: string; slot_end_time?: string; guest_timezone?: string }
    const slot = brTyped.slot_start_time ? { start_time: brTyped.slot_start_time, end_time: brTyped.slot_end_time ?? brTyped.slot_start_time } : null
    const guestTz = brTyped.guest_timezone || 'UTC'
    let slotLine = ''
    if (slot) {
      const formatted = formatInTimezone(slot.start_time, guestTz)
      slotLine = `
        <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin:24px 0;border-left:4px solid #4f46e5;">
          <p style="margin:0 0 4px;font-weight:600;font-size:16px;">${podcast?.title ?? ''}</p>
          <p style="margin:0;font-size:15px;color:#333;">${formatted}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#777;">Times shown in your local timezone (${guestTz})</p>
        </div>`
    }

    const html = emailWrap(`
  <h1 style="color:#1e1e1e;margin-bottom:4px;">You're confirmed!</h1>
  <p style="color:#555;margin-top:0;">Hi ${application.first_name},</p>
  <p style="color:#555;">Great news — your application to appear on <strong>${podcast?.title ?? 'our podcast'}</strong> has been approved.</p>
  ${slotLine}
  <p style="color:#555;">We look forward to having you on the show. We'll be in touch with any further details closer to the date.</p>
  <p style="color:#555;"><strong>The ${podcast?.title ?? 'Guest Booking System'} Team</strong></p>`)

    try {
      await sendEmail({
        to: { email: application.email, name: `${application.first_name} ${application.last_name}` },
        subject: `You're confirmed — ${podcast?.title ?? 'Podcast Interview'}`,
        htmlContent: html,
      })
    } catch (e) {
      console.error('Failed to send approval email:', e)
    }
  }

  redirect('/dashboard?message=Booking+approved.')
}

export async function rejectBooking(bookingRequestId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcastIds = await getHostPodcastIds(user.id)
  const adminSupabase = createAdminClient()

  const { data: br } = await adminSupabase
    .from('booking_requests')
    .select('id, podcast_id, status')
    .eq('id', bookingRequestId)
    .single()

  if (!br || !podcastIds.includes(br.podcast_id)) redirect('/dashboard')

  // Find associated application for refund
  const { data: application } = await adminSupabase
    .from('applications')
    .select('id, email, first_name, last_name, payment_status, payment_provider, payment_intent_id, amount_cents')
    .eq('booking_request_id', bookingRequestId)
    .maybeSingle()

  // Fetch podcast's own payment credentials for refund
  const { data: creds } = await adminSupabase
    .from('podcast_payment_credentials')
    .select('stripe_secret_key, paypal_client_id, paypal_client_secret')
    .eq('podcast_id', br.podcast_id)
    .maybeSingle()

  // Issue refund if paid
  if (application?.payment_status === 'paid' && application.payment_intent_id) {
    try {
      const stripeSecretKey = creds?.stripe_secret_key || process.env.STRIPE_SECRET_KEY
      const paypalClientId = creds?.paypal_client_id || process.env.PAYPAL_CLIENT_ID
      const paypalClientSecret = creds?.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET

      if (application.payment_provider === 'stripe' && stripeSecretKey) {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeSecretKey)
        await stripe.refunds.create({ payment_intent: application.payment_intent_id })
      } else if (application.payment_provider === 'paypal' && paypalClientId && paypalClientSecret) {
        const { refundPayPalCapture } = await import('@/lib/paypal')
        await refundPayPalCapture(application.payment_intent_id, {
          clientId: paypalClientId,
          clientSecret: paypalClientSecret,
        })
      }
    } catch (e) {
      console.error('Refund error:', e)
    }
  }

  // Update booking request and application status
  await Promise.all([
    adminSupabase
      .from('booking_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', bookingRequestId),
    application
      ? adminSupabase
          .from('applications')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', application.id)
      : Promise.resolve(),
  ])

  // Send rejection email to guest
  if (application?.email) {
    const { data: podcast } = await supabase
      .from('podcasts')
      .select('title')
      .eq('id', br.podcast_id)
      .single()

    const wasCharged =
      application.payment_status === 'paid' && (application.amount_cents ?? 0) > 0
    const refundLine = wasCharged
      ? `<p style="color:#555;">A full refund has been issued to your original payment method. Please allow 3–5 business days for it to appear.</p>`
      : ''

    const html = emailWrap(`
  <h1 style="color:#1e1e1e;margin-bottom:4px;">Thank You for Your Application</h1>
  <p style="color:#555;margin-top:0;">Hi ${application.first_name},</p>

  <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin:24px 0;border-left:4px solid #6b7280;">
    <p style="margin:0 0 4px;font-weight:600;font-size:16px;">${podcast?.title ?? 'Our Podcast'}</p>
    <p style="margin:0;font-size:14px;color:#555;">Application Status: <strong>Unsuccessful</strong></p>
  </div>

  <p style="color:#555;">Thank you for taking the time to apply to appear on <strong>${podcast?.title ?? 'our podcast'}</strong>. After careful review, we are unable to move forward with your application at this time.</p>
  <p style="color:#555;">We truly appreciate your interest and the effort you put into your application. We wish you every success with your future endeavours.</p>
  ${refundLine}
  <p style="margin-top:32px;color:#555;">We wish you all the best!</p>
  <p style="color:#555;"><strong>The ${podcast?.title ?? 'Guest Booking System'} Team</strong></p>`)

    try {
      await sendEmail({
        to: { email: application.email, name: `${application.first_name} ${application.last_name}` },
        subject: `Your application to ${podcast?.title ?? 'our podcast'}`,
        htmlContent: html,
      })
    } catch (e) {
      console.error('Failed to send rejection email:', e)
    }
  }

  redirect('/dashboard?message=Booking+rejected+and+guest+notified.')
}

// Guest-initiated reschedule: guest picks a new time slot themselves
export async function rescheduleBooking(bookingRequestId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const adminSupabase = createAdminClient()

  // Verify the guest owns this booking
  const { data: br } = await adminSupabase
    .from('booking_requests')
    .select('id, podcast_id, guest_id, status')
    .eq('id', bookingRequestId)
    .eq('guest_id', user.id)
    .single()

  if (!br) redirect('/dashboard?error=Booking+not+found.')
  if (br.status === 'completed' || br.status === 'rejected') redirect('/dashboard')

  // Find the associated application
  const { data: app } = await adminSupabase
    .from('applications')
    .select('id')
    .eq('booking_request_id', bookingRequestId)
    .maybeSingle()

  // Delete the old booking request — this frees the slot for others
  await adminSupabase
    .from('booking_requests')
    .delete()
    .eq('id', bookingRequestId)

  if (!app) {
    // No linked application (e.g. manually created test data) — redirect to podcast page to re-apply
    redirect(`/book/${br.podcast_id}?error=Could+not+find+your+application.+Please+re-apply.`)
  }

  // Reset application so the guest can pick a new slot
  await adminSupabase
    .from('applications')
    .update({
      status: 'pending',
      slot_id: null,
      booking_request_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', app.id)

  redirect(`/book/${br.podcast_id}/slots?app=${app.id}&reschedule=1`)
}

// Host-initiated reschedule: host cancels the slot and emails the guest to pick a new time
export async function hostRequestReschedule(bookingRequestId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcastIds = await getHostPodcastIds(user.id)
  const adminSupabase = createAdminClient()

  const { data: br } = await adminSupabase
    .from('booking_requests')
    .select('id, podcast_id, status, slot_start_time, slot_end_time, guest_timezone')
    .eq('id', bookingRequestId)
    .single()

  if (!br || !podcastIds.includes(br.podcast_id)) redirect('/dashboard')
  if (br.status === 'completed' || br.status === 'rejected') redirect('/dashboard')

  // Find the associated application + guest email
  const { data: application } = await adminSupabase
    .from('applications')
    .select('id, email, first_name, last_name')
    .eq('booking_request_id', bookingRequestId)
    .maybeSingle()

  const { data: podcast } = await adminSupabase
    .from('podcasts')
    .select('id, title')
    .eq('id', br.podcast_id)
    .single()

  // Delete the booking request — frees the slot
  await adminSupabase
    .from('booking_requests')
    .delete()
    .eq('id', bookingRequestId)

  if (application) {
    // Reset the application so the guest can pick a new slot (payment already done — keep payment_status)
    await adminSupabase
      .from('applications')
      .update({
        status: 'pending',
        slot_id: null,
        booking_request_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id)

    // Send reschedule email to guest with a link to pick a new time
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const slotsUrl = `${appUrl}/book/${br.podcast_id}/slots?app=${application.id}&reschedule=1`

    const brTyped2 = br as unknown as { slot_start_time?: string; guest_timezone?: string }
    const guestTz2 = brTyped2.guest_timezone || 'UTC'
    let oldSlotLine = ''
    if (br.slot_start_time) {
      const formatted = formatInTimezone(br.slot_start_time, guestTz2)
      oldSlotLine = `<p style="color:#555;">Your previously scheduled time was <strong>${formatted}</strong> (${guestTz2}).</p>`
    }

    const html = emailWrap(`
  <h1 style="color:#1e1e1e;margin-bottom:4px;">Your Interview Needs to Be Rescheduled</h1>
  <p style="color:#555;margin-top:0;">Hi ${application.first_name},</p>
  <p style="color:#555;">We're sorry, but your upcoming interview on <strong>${podcast?.title ?? 'our show'}</strong> needs to be rescheduled.</p>
  ${oldSlotLine}
  <p style="color:#555;">Please click the button below to choose a new time that works for you. Your application and payment are fully intact — you just need to pick a new slot.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${slotsUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">
      Choose a New Time →
    </a>
  </div>
  <p style="color:#555;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="color:#4f46e5;word-break:break-all;font-size:13px;">${slotsUrl}</p>
  <p style="margin-top:32px;color:#555;">We apologise for any inconvenience and look forward to speaking with you soon.</p>
  <p style="color:#555;"><strong>The ${podcast?.title ?? 'Guest Booking System'} Team</strong></p>`)

    try {
      await sendEmail({
        to: { email: application.email, name: `${application.first_name} ${application.last_name}` },
        subject: `Your interview on ${podcast?.title ?? 'our podcast'} needs to be rescheduled`,
        htmlContent: html,
      })
    } catch (e) {
      console.error('Failed to send reschedule email:', e)
    }
  }

  redirect('/dashboard?message=Slot+cancelled.+Guest+has+been+emailed+to+pick+a+new+time.')
}

export async function markComplete(bookingRequestId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcastIds = await getHostPodcastIds(user.id)
  const adminSupabase = createAdminClient()

  const { data: br } = await adminSupabase
    .from('booking_requests')
    .select('id, podcast_id, status')
    .eq('id', bookingRequestId)
    .single()

  if (!br || !podcastIds.includes(br.podcast_id)) redirect('/dashboard')

  await adminSupabase
    .from('booking_requests')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', bookingRequestId)

  redirect('/dashboard?message=Interview+marked+as+complete.')
}

export async function deleteApplication(applicationId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcastIds = await getHostPodcastIds(user.id)
  const adminSupabase = createAdminClient()

  const { data: app } = await adminSupabase
    .from('applications')
    .select('id, podcast_id, booking_request_id')
    .eq('id', applicationId)
    .maybeSingle()

  if (!app || !podcastIds.includes(app.podcast_id)) redirect('/dashboard')

  // Delete associated booking request if it exists
  if (app.booking_request_id) {
    await adminSupabase
      .from('booking_requests')
      .delete()
      .eq('id', app.booking_request_id)
  }

  await adminSupabase.from('applications').delete().eq('id', applicationId)

  redirect('/dashboard?message=Application+deleted.')
}
