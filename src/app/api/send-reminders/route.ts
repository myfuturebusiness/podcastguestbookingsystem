import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/brevo'
import { emailWrap } from '@/lib/email-templates'
import { formatInTimezone } from '@/lib/availability'

export async function POST(req: NextRequest) {
  // Verify the request is from our GitHub Actions cron (or internal)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const now = new Date()

  // Find bookings starting between 55 and 65 minutes from now, reminder not yet sent
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() + 65 * 60 * 1000).toISOString()

  const { data: upcoming, error } = await adminSupabase
    .from('booking_requests')
    .select(`
      id,
      slot_start_time,
      slot_end_time,
      guest_timezone,
      podcast_id,
      guest_id,
      podcasts ( title, host_id ),
      profiles!booking_requests_guest_id_fkey ( full_name, email, timezone )
    `)
    .gte('slot_start_time', windowStart)
    .lte('slot_start_time', windowEnd)
    .in('status', ['pending', 'approved'])
    .is('reminder_sent_at', null)

  if (error) {
    console.error('Reminder query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!upcoming || upcoming.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const booking of upcoming) {
    const podcast = booking.podcasts as unknown as { title: string; host_id: string } | null
    const guest = booking.profiles as unknown as { full_name: string; email: string; timezone?: string } | null

    if (!podcast || !booking.slot_start_time) continue

    // Fetch host profile for email + timezone
    const { data: hostProfile } = await adminSupabase
      .from('profiles')
      .select('email, full_name, timezone')
      .eq('id', podcast.host_id)
      .single()

    const guestTimezone = booking.guest_timezone || guest?.timezone || 'UTC'
    const hostTimezone = (hostProfile as { timezone?: string })?.timezone || 'UTC'

    const guestTimeFormatted = formatInTimezone(booking.slot_start_time, guestTimezone)
    const hostTimeFormatted = formatInTimezone(booking.slot_start_time, hostTimezone)

    // Send reminder to guest
    if (guest?.email) {
      try {
        await sendEmail({
          to: { email: guest.email, name: guest.full_name ?? 'Guest' },
          subject: `Reminder: Your interview on ${podcast.title} is in 1 hour`,
          htmlContent: emailWrap(`
  <h1 style="color:#4f46e5;margin-bottom:4px;">Interview Reminder</h1>
  <p style="color:#555;margin-top:0;">Hi ${guest.full_name?.split(' ')[0] ?? 'there'},</p>
  <p style="color:#555;">This is a friendly reminder that your interview on <strong>${podcast.title}</strong> is starting in approximately <strong>1 hour</strong>.</p>
  <div style="background:#f0f4ff;border-radius:8px;padding:16px 20px;margin:24px 0;border-left:4px solid #4f46e5;">
    <p style="margin:0;font-weight:600;font-size:15px;">${podcast.title}</p>
    <p style="margin:4px 0 0;color:#555;">${guestTimeFormatted}</p>
  </div>
  <h3 style="color:#1e1e1e;">Quick checklist before you join:</h3>
  <ul style="line-height:2;color:#333;padding-left:20px;">
    <li><strong>NO WIFI</strong> — use a hard-wired ethernet connection</li>
    <li>Find a quiet room with doors and windows closed</li>
    <li>Wear headphones to prevent audio feedback</li>
    <li>Test your audio and video now</li>
  </ul>
  <p style="margin-top:24px;color:#555;">We look forward to having you on the show!</p>
  <p style="color:#555;"><strong>The ${podcast.title} Team</strong></p>`),
        })
      } catch (e) {
        console.error('Failed to send guest reminder:', e)
      }
    }

    // Send reminder to host
    if (hostProfile?.email) {
      try {
        await sendEmail({
          to: { email: hostProfile.email, name: hostProfile.full_name ?? 'Host' },
          subject: `Reminder: Interview with ${guest?.full_name ?? 'your guest'} is in 1 hour`,
          htmlContent: emailWrap(`
  <h1 style="color:#4f46e5;margin-bottom:4px;">Interview Reminder</h1>
  <p style="color:#555;margin-top:0;">Hi ${hostProfile.full_name?.split(' ')[0] ?? 'there'},</p>
  <p style="color:#555;">You have an interview coming up in approximately <strong>1 hour</strong>.</p>
  <div style="background:#f0f4ff;border-radius:8px;padding:16px 20px;margin:24px 0;border-left:4px solid #4f46e5;">
    <p style="margin:0;font-weight:600;font-size:15px;">Guest: ${guest?.full_name ?? 'Unknown'}</p>
    <p style="margin:4px 0 0;color:#555;">${hostTimeFormatted}</p>
  </div>
  <p style="color:#555;">Make sure you are set up and ready to go. Good luck with the interview!</p>
  <p style="color:#555;"><strong>Guest Booking System</strong></p>`),
        })
      } catch (e) {
        console.error('Failed to send host reminder:', e)
      }
    }

    // Mark reminder as sent
    await adminSupabase
      .from('booking_requests')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', booking.id)

    sent++
  }

  return NextResponse.json({ sent })
}
