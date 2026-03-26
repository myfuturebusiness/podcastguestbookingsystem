'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'
import { getAppUrl } from '@/lib/app-url'

export async function submitApplication(formData: FormData) {
  const podcastId = formData.get('podcast_id') as string
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName = (formData.get('last_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const website = (formData.get('website') as string)?.trim() || null
  const category = formData.get('category') as string
  const topic = (formData.get('topic') as string)?.trim()
  const twitter = (formData.get('twitter') as string)?.trim() || null
  const linkedin = (formData.get('linkedin') as string)?.trim() || null
  const facebook = (formData.get('facebook') as string)?.trim() || null
  const instagram = (formData.get('instagram') as string)?.trim() || null
  const bioText = (formData.get('bio_text') as string)?.trim() || null
  const interviewFormat = (formData.get('interview_format') as string) || 'audio'
  const discoveryMethod = formData.get('discovery_method') as string
  const bioFile = formData.get('bio_file') as File | null
  const paymentMethod = (formData.get('payment_method') as string) || 'stripe'

  const applyBase = `/book/${podcastId}/apply?tier=${interviewFormat}`

  if (!firstName || !lastName || !email || !topic || !category || !discoveryMethod) {
    redirect(`${applyBase}&error=Please+fill+in+all+required+fields`)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    redirect(`${applyBase}&error=Please+enter+a+valid+email+address`)
  }

  const adminSupabase = createAdminClient()
  const applicationId = randomUUID()

  // Upload bio file if provided
  let bioPdfUrl: string | null = null
  if (bioFile && bioFile.size > 0) {
    if (bioFile.size > 5 * 1024 * 1024) {
      redirect(`${applyBase}&error=Bio+file+must+be+under+5+MB`)
    }
    const allowedTypes = ['application/pdf', 'text/plain']
    if (!allowedTypes.includes(bioFile.type)) {
      redirect(`${applyBase}&error=Bio+file+must+be+a+PDF+or+TXT+file`)
    }
    const ext = bioFile.type === 'application/pdf' ? 'pdf' : 'txt'
    const path = `${applicationId}/bio.${ext}`
    const arrayBuffer = await bioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminSupabase.storage
      .from('bio-uploads')
      .upload(path, buffer, { contentType: bioFile.type })

    if (!uploadError) {
      bioPdfUrl = path
    }
  }

  // Get podcast and its payment credentials
  const supabase = createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('title, booking_fee_cents, booking_fee_video_cents, booking_fee_premium_cents, currency, accept_stripe, accept_paypal')
    .eq('id', podcastId)
    .single()

  if (!podcast) {
    redirect(`/book/${podcastId}?error=Podcast+not+found`)
  }

  // Fetch podcast's own payment credentials (via admin to bypass RLS)
  const { data: creds } = await adminSupabase
    .from('podcast_payment_credentials')
    .select('stripe_secret_key, paypal_client_id, paypal_client_secret')
    .eq('podcast_id', podcastId)
    .maybeSingle()

  const amountCents =
    interviewFormat === 'premium'
      ? podcast.booking_fee_premium_cents
      : interviewFormat === 'audio_video'
      ? podcast.booking_fee_video_cents
      : podcast.booking_fee_cents

  const formatLabel =
    interviewFormat === 'premium'
      ? 'Premium Offer'
      : interviewFormat === 'audio_video'
      ? 'Audio + Video'
      : 'Audio only'

  const isFree = amountCents === 0

  const { error } = await adminSupabase.from('applications').insert({
    id: applicationId,
    podcast_id: podcastId,
    first_name: firstName,
    last_name: lastName,
    email,
    website,
    category,
    topic,
    twitter,
    linkedin,
    facebook,
    instagram,
    bio_text: bioText,
    bio_pdf_url: bioPdfUrl,
    interview_format: interviewFormat,
    discovery_method: discoveryMethod,
    amount_cents: amountCents,
    interview_format_label: formatLabel,
    payment_status: isFree ? 'free' : 'unpaid',
    status: 'pending',
  })

  if (error) {
    console.error('Application insert error:', error)
    redirect(`${applyBase}&error=Something+went+wrong.+Please+try+again.`)
  }

  // Free tier — go straight to slot selection
  if (isFree) {
    redirect(`/book/${podcastId}/slots?app=${applicationId}`)
  }

  const appUrl = getAppUrl()
  const cancelUrl = `${appUrl}${applyBase}&error=Payment+was+cancelled.+Please+try+again.`

  // PayPal — use podcast's own credentials, fall back to platform env if set
  const paypalClientId = creds?.paypal_client_id || process.env.PAYPAL_CLIENT_ID
  const paypalClientSecret = creds?.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET
  if (paymentMethod === 'paypal' && podcast.accept_paypal && paypalClientId && paypalClientSecret) {
    try {
      const { createPayPalOrder } = await import('@/lib/paypal')
      const { approvalUrl } = await createPayPalOrder({
        amountCents,
        currency: podcast.currency,
        description: `Interview on ${podcast.title} — ${formatLabel}`,
        returnUrl: `${appUrl}/book/${podcastId}/slots?app=${applicationId}`,
        cancelUrl,
        credentials: { clientId: paypalClientId, clientSecret: paypalClientSecret },
      })
      redirect(approvalUrl)
    } catch (e) {
      console.error('PayPal order creation error:', e)
      redirect(`${applyBase}&error=PayPal+checkout+failed.+Please+try+again.`)
    }
  }

  // Stripe — use podcast's own credentials, fall back to platform env if set
  const stripeSecretKey = creds?.stripe_secret_key || process.env.STRIPE_SECRET_KEY
  if (podcast.accept_stripe && stripeSecretKey) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeSecretKey)

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: podcast.currency.toLowerCase(),
              product_data: {
                name: `Interview on ${podcast.title}`,
                description: `${formatLabel} — ${firstName} ${lastName}`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/book/${podcastId}/slots?app=${applicationId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: { application_id: applicationId, podcast_id: podcastId },
      })

      redirect(session.url!)
    } catch (e) {
      console.error('Stripe checkout error:', e)
      redirect(`${applyBase}&error=Payment+checkout+failed.+Please+try+again.`)
    }
  }

  // Dev mode — no payment keys configured, bypass payment
  await adminSupabase
    .from('applications')
    .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', applicationId)
  redirect(`/book/${podcastId}/slots?app=${applicationId}`)
}
