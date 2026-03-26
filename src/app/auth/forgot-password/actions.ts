'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAppUrl } from '@/lib/app-url'

export async function forgotPassword(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/auth/forgot-password?message=Check+your+email+for+a+password+reset+link')
}
