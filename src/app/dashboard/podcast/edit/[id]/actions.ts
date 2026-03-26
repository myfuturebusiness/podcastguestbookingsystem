'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function updatePodcast(id: string, formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const showType = (formData.get('show_type') as string | null)?.trim() || null
  const interviewLabel = (formData.get('interview_label') as string | null)?.trim() || 'Interview'
  const feeInput = formData.get('booking_fee') as string
  const feeVideoInput = formData.get('booking_fee_video') as string
  const feePremiumInput = formData.get('booking_fee_premium') as string
  const currency = (formData.get('currency') as string).trim().toUpperCase()
  const tierAudioDesc = (formData.get('tier_audio_description') as string | null)?.trim() || null
  const tierVideoDesc = (formData.get('tier_video_description') as string | null)?.trim() || null
  const tierPremiumDesc = (formData.get('tier_premium_description') as string | null)?.trim() || null
  const acceptStripe = formData.get('accept_stripe') === '1'
  const acceptPaypal = formData.get('accept_paypal') === '1'

  if (!title || !description || !feeInput || !feeVideoInput || !feePremiumInput || !currency) {
    redirect(`/dashboard/podcast/edit/${id}?error=All+fields+are+required.`)
  }

  const feeCents = Math.round(parseFloat(feeInput) * 100)
  const feeVideoCents = Math.round(parseFloat(feeVideoInput) * 100)
  const feePremiumCents = Math.round(parseFloat(feePremiumInput) * 100)
  if (isNaN(feeCents) || feeCents < 0 || isNaN(feeVideoCents) || feeVideoCents < 0 || isNaN(feePremiumCents) || feePremiumCents < 0) {
    redirect(`/dashboard/podcast/edit/${id}?error=Booking+fees+must+be+valid+non-negative+numbers.`)
  }

  const { error } = await supabase
    .from('podcasts')
    .update({
      title,
      description,
      show_type: showType,
      interview_label: interviewLabel,
      booking_fee_cents: feeCents,
      booking_fee_video_cents: feeVideoCents,
      booking_fee_premium_cents: feePremiumCents,
      currency,
      tier_audio_description: tierAudioDesc,
      tier_video_description: tierVideoDesc,
      tier_premium_description: tierPremiumDesc,
      accept_stripe: acceptStripe,
      accept_paypal: acceptPaypal,
    })
    .eq('id', id)
    .eq('host_id', user.id)

  if (error) {
    redirect(`/dashboard/podcast/edit/${id}?error=${encodeURIComponent(error.message)}`)
  }

  // Save payment credentials — only update fields that were submitted (non-empty)
  const stripePublishableKey = (formData.get('stripe_publishable_key') as string | null)?.trim() || null
  const stripeSecretKey = (formData.get('stripe_secret_key') as string | null)?.trim() || null
  const paypalClientId = (formData.get('paypal_client_id') as string | null)?.trim() || null
  const paypalClientSecret = (formData.get('paypal_client_secret') as string | null)?.trim() || null

  const hasAnyCredential = stripePublishableKey || stripeSecretKey || paypalClientId || paypalClientSecret

  if (hasAnyCredential) {
    const adminSupabase = createAdminClient()

    // Build partial update — only overwrite fields that were provided
    const credUpdate: Record<string, string> = { updated_at: new Date().toISOString() }
    if (stripePublishableKey) credUpdate.stripe_publishable_key = stripePublishableKey
    if (stripeSecretKey) credUpdate.stripe_secret_key = stripeSecretKey
    if (paypalClientId) credUpdate.paypal_client_id = paypalClientId
    if (paypalClientSecret) credUpdate.paypal_client_secret = paypalClientSecret

    const { error: credError } = await adminSupabase
      .from('podcast_payment_credentials')
      .upsert({ podcast_id: id, ...credUpdate }, { onConflict: 'podcast_id' })

    if (credError) {
      redirect(`/dashboard/podcast/edit/${id}?error=${encodeURIComponent(credError.message)}`)
    }
  }

  redirect('/dashboard?message=Podcast+profile+updated.')
}
