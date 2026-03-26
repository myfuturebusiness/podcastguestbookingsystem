'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createCheckoutSession(formData: FormData) {
  const applicationId = formData.get('application_id') as string
  const podcastId = formData.get('podcast_id') as string

  const adminSupabase = createAdminClient()
  const { data: application } = await adminSupabase
    .from('applications')
    .select('email, first_name, last_name, amount_cents, interview_format')
    .eq('id', applicationId)
    .single()

  if (!application) redirect(`/book/${podcastId}`)

  const supabase = createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('title, currency')
    .eq('id', podcastId)
    .single()

  if (!podcast) redirect(`/book/${podcastId}`)

  // Fetch podcast's own payment credentials
  const { data: creds } = await adminSupabase
    .from('podcast_payment_credentials')
    .select('stripe_secret_key')
    .eq('podcast_id', podcastId)
    .maybeSingle()

  const stripeSecretKey = creds?.stripe_secret_key || process.env.STRIPE_SECRET_KEY

  // If Stripe is not configured, bypass payment (dev / test mode)
  if (!stripeSecretKey) {
    await adminSupabase
      .from('applications')
      .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', applicationId)
    redirect(`/book/${podcastId}/slots?app=${applicationId}`)
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(stripeSecretKey!)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: application.email,
    line_items: [
      {
        price_data: {
          currency: podcast.currency.toLowerCase(),
          product_data: {
            name: `Interview on ${podcast.title}`,
            description: `${application.interview_format === 'audio_video' ? 'Audio + Video' : 'Audio only'} — ${application.first_name} ${application.last_name}`,
          },
          unit_amount: application.amount_cents ?? 0,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/book/${podcastId}/slots?app=${applicationId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/book/${podcastId}/pay?app=${applicationId}&cancelled=1`,
    metadata: { application_id: applicationId, podcast_id: podcastId },
  })

  redirect(session.url!)
}
