'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePodcast(formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const feeInput = formData.get('booking_fee') as string
  const currency = (formData.get('currency') as string).trim().toUpperCase()

  if (!title || !description || !feeInput || !currency) {
    redirect('/dashboard/podcast/edit?error=All+fields+are+required.')
  }

  const feeCents = Math.round(parseFloat(feeInput) * 100)
  if (isNaN(feeCents) || feeCents < 0) {
    redirect('/dashboard/podcast/edit?error=Booking+fee+must+be+a+valid+non-negative+number.')
  }

  const { error } = await supabase
    .from('podcasts')
    .update({ title, description, booking_fee_cents: feeCents, currency })
    .eq('host_id', user.id)

  if (error) {
    redirect(`/dashboard/podcast/edit?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard?message=Podcast+profile+updated.')
}
