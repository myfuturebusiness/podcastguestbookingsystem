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

export async function setUserRole(formData: FormData) {
  await assertAdmin()
  const adminSupabase = createAdminClient()

  const userId = formData.get('user_id') as string
  const newRole = formData.get('new_role') as string

  if (!userId || !['guest', 'host'].includes(newRole)) return

  await adminSupabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  revalidatePath('/admin')
}
