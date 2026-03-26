'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getHostPodcastIds(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase.from('podcasts').select('id').eq('host_id', userId)
  return (data ?? []).map((p) => p.id)
}

// ── Availability Rules ────────────────────────────────────────────────────────

export async function addRule(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcast_id = formData.get('podcast_id') as string
  const days = formData.getAll('day_of_week').map((d) => parseInt(d as string))
  const slot_duration_minutes = parseInt(formData.get('slot_duration_minutes') as string)
  const advance_booking_days = parseInt(formData.get('advance_booking_days') as string)
  const globalStart = formData.get('start_time') as string | null
  const globalEnd = formData.get('end_time') as string | null

  if (!podcast_id || days.length === 0 || isNaN(slot_duration_minutes) || isNaN(advance_booking_days)) {
    redirect('/dashboard/availability?error=Please+select+at+least+one+day+and+fill+all+fields.')
  }

  const podcastIds = await getHostPodcastIds(user.id)
  if (!podcastIds.includes(podcast_id)) redirect('/dashboard')

  const rows = []
  for (const day of days) {
    const start_time = (formData.get(`start_time_${day}`) as string | null) || globalStart
    const end_time = (formData.get(`end_time_${day}`) as string | null) || globalEnd
    if (!start_time || !end_time) {
      redirect('/dashboard/availability?error=Please+set+times+for+all+selected+days.')
    }
    if (end_time <= start_time) {
      redirect('/dashboard/availability?error=End+time+must+be+after+start+time+for+each+day.')
    }
    rows.push({ podcast_id, day_of_week: day, start_time, end_time, slot_duration_minutes, advance_booking_days })
  }

  const { error } = await supabase.from('availability_rules').insert(rows)
  if (error) redirect(`/dashboard/availability?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/availability')
  redirect('/dashboard/availability')
}

export async function deleteRule(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const ruleId = formData.get('rule_id') as string
  if (!ruleId) return

  const podcastIds = await getHostPodcastIds(user.id)

  const { error } = await supabase
    .from('availability_rules')
    .delete()
    .eq('id', ruleId)
    .in('podcast_id', podcastIds)

  if (error) redirect(`/dashboard/availability?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/availability')
  redirect('/dashboard/availability')
}

// ── Availability Blocks ───────────────────────────────────────────────────────

export async function addBlock(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const podcast_id = formData.get('podcast_id') as string
  const block_start = formData.get('block_start') as string
  const block_end = formData.get('block_end') as string
  const reason = (formData.get('reason') as string) || null

  if (!podcast_id || !block_start || !block_end) {
    redirect('/dashboard/availability?error=Podcast+and+dates+are+required.')
  }

  if (block_end < block_start) {
    redirect('/dashboard/availability?error=End+date+must+be+on+or+after+start+date.')
  }

  const podcastIds = await getHostPodcastIds(user.id)
  if (!podcastIds.includes(podcast_id)) redirect('/dashboard')

  const { error } = await supabase.from('availability_blocks').insert({
    podcast_id,
    block_start,
    block_end,
    reason,
  })

  if (error) redirect(`/dashboard/availability?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/availability')
  redirect('/dashboard/availability')
}

export async function deleteBlock(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const blockId = formData.get('block_id') as string
  if (!blockId) return

  const podcastIds = await getHostPodcastIds(user.id)

  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', blockId)
    .in('podcast_id', podcastIds)

  if (error) redirect(`/dashboard/availability?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/availability')
  redirect('/dashboard/availability')
}

// ── Host Timezone ─────────────────────────────────────────────────────────────

export async function updateTimezone(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const timezone = formData.get('timezone') as string
  if (!timezone) redirect('/dashboard/availability?error=Timezone+is+required.')

  const { error } = await supabase
    .from('profiles')
    .update({ timezone })
    .eq('id', user.id)

  if (error) redirect(`/dashboard/availability?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard/availability')
  redirect('/dashboard/availability?message=Timezone+saved.')
}

// ── Legacy slot actions (kept for backward compat) ────────────────────────────

export async function deleteSlot(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const slotId = formData.get('slot_id') as string
  if (!slotId) return

  await supabase.from('availability_slots').delete().eq('id', slotId).eq('host_id', user.id)

  revalidatePath('/dashboard/availability')
  redirect('/dashboard/availability')
}
