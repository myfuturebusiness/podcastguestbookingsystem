'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createSetupAccount(formData: FormData) {
  const adminSupabase = createAdminClient()

  // Double-check no admin exists yet
  const { count } = await adminSupabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  if ((count ?? 0) > 0) {
    redirect('/auth/signin')
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const full_name = (formData.get('full_name') as string)?.trim()

  if (!email || !password || !full_name) {
    redirect('/admin/setup?error=All+fields+are+required.')
  }

  // Create the auth user
  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !newUser.user) {
    redirect(`/admin/setup?error=${encodeURIComponent(createError?.message ?? 'Could not create account.')}`)
  }

  // The auth trigger auto-creates the profile — update it to admin role
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ role: 'admin', full_name, email })
    .eq('id', newUser.user.id)

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    redirect(`/admin/setup?error=${encodeURIComponent('Could not create admin profile. Please try again.')}`)
  }

  redirect('/admin/setup?done=1')
}
