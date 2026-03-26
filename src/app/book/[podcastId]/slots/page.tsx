import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import { generateAvailableSlots } from '@/lib/availability'
import type { AvailabilityRule, AvailabilityBlock } from '@/lib/availability'
import SlotCalendar from './SlotCalendar'

export default async function SlotsPage({
  params,
  searchParams,
}: {
  params: { podcastId: string }
  searchParams: { app?: string; session_id?: string; token?: string; error?: string; reschedule?: string }
}) {
  const { podcastId } = params
  const applicationId = searchParams.app

  if (!applicationId) redirect(`/book/${podcastId}`)

  const adminSupabase = createAdminClient()
  const { data: application } = await adminSupabase
    .from('applications')
    .select('id, first_name, email, payment_status, status, podcast_id')
    .eq('id', applicationId)
    .eq('podcast_id', podcastId)
    .single()

  if (!application) redirect(`/book/${podcastId}`)
  if (application.status === 'confirmed') {
    redirect(`/book/${podcastId}/thankyou?app=${applicationId}`)
  }

  // Fetch podcast's own payment credentials (needed for Stripe verify + PayPal capture)
  const { data: podcastCreds } = await adminSupabase
    .from('podcast_payment_credentials')
    .select('stripe_secret_key, paypal_client_id, paypal_client_secret')
    .eq('podcast_id', podcastId)
    .maybeSingle()

  const stripeSecretKey = podcastCreds?.stripe_secret_key || process.env.STRIPE_SECRET_KEY
  const paypalClientId = podcastCreds?.paypal_client_id || process.env.PAYPAL_CLIENT_ID
  const paypalClientSecret = podcastCreds?.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET

  // Verify Stripe payment if returning from Stripe checkout
  if (
    searchParams.session_id &&
    application.payment_status === 'unpaid' &&
    stripeSecretKey
  ) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeSecretKey)
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id)
      if (session.payment_status === 'paid') {
        await adminSupabase
          .from('applications')
          .update({
            payment_status: 'paid',
            payment_intent_id: session.payment_intent as string,
            payment_provider: 'stripe',
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId)
        application.payment_status = 'paid'
      }
    } catch (e) {
      console.error('Stripe verification error:', e)
    }
  }

  // Capture PayPal payment if returning from PayPal (token = PayPal order ID)
  if (
    searchParams.token &&
    application.payment_status === 'unpaid' &&
    paypalClientId &&
    paypalClientSecret
  ) {
    try {
      const { capturePayPalOrder } = await import('@/lib/paypal')
      const { success, captureId } = await capturePayPalOrder(searchParams.token, {
        clientId: paypalClientId,
        clientSecret: paypalClientSecret,
      })
      if (success) {
        await adminSupabase
          .from('applications')
          .update({
            payment_status: 'paid',
            payment_intent_id: captureId ?? null,
            payment_provider: 'paypal',
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId)
        application.payment_status = 'paid'
      }
    } catch (e) {
      console.error('PayPal capture error:', e)
    }
  }

  const supabase = createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('id, title, booking_fee_cents, is_active')
    .eq('id', podcastId)
    .single()

  if (!podcast || !podcast.is_active) notFound()

  const isFree = podcast.booking_fee_cents === 0
  const isPaid = application.payment_status === 'paid' || application.payment_status === 'free'

  if (!isFree && !isPaid) {
    const { data: app } = await adminSupabase
      .from('applications')
      .select('interview_format')
      .eq('id', applicationId)
      .single()
    redirect(`/book/${podcastId}/apply?tier=${app?.interview_format ?? 'audio'}&error=Please+complete+payment+to+continue.`)
  }

  // Fetch host timezone
  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', (await supabase.from('podcasts').select('host_id').eq('id', podcastId).single()).data?.host_id ?? '')
    .maybeSingle()
  const hostTimezone = (hostProfile as { timezone?: string })?.timezone ?? 'UTC'

  // Fetch availability rules and blocks for dynamic slot generation
  const [{ data: rulesRaw }, { data: blocksRaw }, { data: bookedRequests }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('id, podcast_id, day_of_week, start_time, end_time, slot_duration_minutes, advance_booking_days')
      .eq('podcast_id', podcastId),
    supabase
      .from('availability_blocks')
      .select('id, podcast_id, block_start, block_end, reason')
      .eq('podcast_id', podcastId),
    supabase
      .from('booking_requests')
      .select('slot_start_time')
      .eq('podcast_id', podcastId)
      .in('status', ['pending', 'approved']),
  ])

  const bookedStartTimes = new Set(
    (bookedRequests ?? []).map((r) => (r as { slot_start_time: string }).slot_start_time).filter(Boolean)
  )

  const availableSlots = generateAvailableSlots(
    (rulesRaw ?? []) as AvailabilityRule[],
    (blocksRaw ?? []) as AvailabilityBlock[],
    bookedStartTimes,
    hostTimezone
  )

  const stepLabel = isFree ? 'Step 2 of 2' : 'Step 3 of 3'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <Link href="/"><Logo compact /></Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-xl mx-auto px-6 py-12">
        {searchParams.error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}

        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            {stepLabel}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Interview Time
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hi {application.first_name}, select the date and time that works best for you.
            All times are shown in your local timezone.
          </p>
        </div>

        <SlotCalendar
          slots={availableSlots}
          podcastId={podcastId}
          applicationId={applicationId!}
          podcastTitle={podcast.title}
          isReschedule={searchParams.reschedule === '1'}
        />
      </main>
    </div>
  )
}
