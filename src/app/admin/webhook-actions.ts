'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')
}

export async function addWebhook(formData: FormData) {
  await assertAdmin()
  const adminSupabase = createAdminClient()

  const name = (formData.get('name') as string)?.trim()
  const url = (formData.get('url') as string)?.trim()
  const secret = (formData.get('secret') as string)?.trim() || null
  const events = formData.getAll('events') as string[]

  if (!name || !url || events.length === 0) return

  await adminSupabase.from('webhook_endpoints').insert({
    name,
    url,
    secret: secret || null,
    events,
    is_active: true,
  })

  revalidatePath('/admin')
}

export async function deleteWebhook(formData: FormData) {
  await assertAdmin()
  const adminSupabase = createAdminClient()
  const id = formData.get('id') as string
  if (!id) return
  await adminSupabase.from('webhook_endpoints').delete().eq('id', id)
  revalidatePath('/admin')
}

export async function toggleWebhook(formData: FormData) {
  await assertAdmin()
  const adminSupabase = createAdminClient()
  const id = formData.get('id') as string
  const currentActive = formData.get('is_active') === 'true'
  if (!id) return
  await adminSupabase
    .from('webhook_endpoints')
    .update({ is_active: !currentActive })
    .eq('id', id)
  revalidatePath('/admin')
}
