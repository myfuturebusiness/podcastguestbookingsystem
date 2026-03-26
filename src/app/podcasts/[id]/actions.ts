'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function bookSlot(formData: FormData) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcast_id = formData.get('podcast_id') as string
  const slot_id = formData.get('slot_id') as string

  if (!podcast_id || !slot_id) {
    redirect(
      `/podcasts/${podcast_id ?? ''}?error=${encodeURIComponent('Please select a time slot.')}`
    )
  }

  // Verify the slot exists and belongs to this podcast
  const { data: slot } = await supabase
    .from('availability_slots')
    .select('id')
    .eq('id', slot_id)
    .eq('podcast_id', podcast_id)
    .single()

  if (!slot) {
    redirect(
      `/podcasts/${podcast_id}?error=${encodeURIComponent('This slot is no longer available.')}`
    )
  }

  // Prevent double-booking
  const { data: existing } = await supabase
    .from('booking_requests')
    .select('id')
    .eq('slot_id', slot_id)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (existing) {
    redirect(
      `/podcasts/${podcast_id}?error=${encodeURIComponent(
        'This slot has already been booked. Please choose another.'
      )}`
    )
  }

  const { error } = await supabase.from('booking_requests').insert({
    guest_id: user.id,
    podcast_id,
    slot_id,
    status: 'pending',
  })

  if (error) {
    redirect(`/podcasts/${podcast_id}?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard?message=Your+booking+request+has+been+submitted!')
}
