'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createPodcast(formData: FormData) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { count } = await supabase
    .from('podcasts')
    .select('id', { count: 'exact', head: true })
    .eq('host_id', user.id)

  if ((count ?? 0) >= 3) {
    redirect('/dashboard/podcast/new?error=You+can+have+a+maximum+of+3+podcast+profiles.')
  }

  const name = (formData.get('title') as string).trim()
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

  if (!name || !description || !feeInput || !feeVideoInput || !feePremiumInput || !currency) {
    redirect('/dashboard/podcast/new?error=All+fields+are+required.')
  }

  const feeCents = Math.round(parseFloat(feeInput) * 100)
  const feeVideoCents = Math.round(parseFloat(feeVideoInput) * 100)
  const feePremiumCents = Math.round(parseFloat(feePremiumInput) * 100)
  if (isNaN(feeCents) || feeCents < 0 || isNaN(feeVideoCents) || feeVideoCents < 0 || isNaN(feePremiumCents) || feePremiumCents < 0) {
    redirect('/dashboard/podcast/new?error=Booking+fees+must+be+valid+non-negative+numbers.')
  }

  const { error } = await supabase.from('podcasts').insert({
    host_id: user.id,
    title: name,
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
    is_active: true,
  })

  if (error) {
    redirect(`/dashboard/podcast/new?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}
