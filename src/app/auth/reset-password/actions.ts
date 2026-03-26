'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
  const supabase = createClient()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) {
    redirect('/auth/reset-password?error=Passwords+do+not+match')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}
